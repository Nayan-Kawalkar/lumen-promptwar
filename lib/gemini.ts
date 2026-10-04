import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { SYSTEM } from "./prompts";

/** Comma-separated fallback chain; the first healthy model wins. */
const MODELS = (
  process.env.GEMINI_MODEL || "gemini-3-flash-preview,gemini-3.1-flash-lite,gemini-flash-lite-latest,gemini-3.8-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/** Circuit breaker: a model that was rate-limited or overloaded is skipped until this time. */
const coolingUntil = new Map<string, number>();

function cooldownMs(err: unknown) {
  const e = err as { status?: number; message?: string };
  if (e?.status === 404) return 60 * 60_000; // retired for this key — don't ask again for an hour
  const hinted = /retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/.exec(e?.message ?? "");
  return hinted ? Math.min(Number(hinted[1]) * 1000, 120_000) : 30_000;
}

/** Healthy models first (in configured order), then cooling ones as a last resort. */
function modelOrder() {
  const now = Date.now();
  const healthy = MODELS.filter((m) => (coolingUntil.get(m) ?? 0) <= now);
  const cooling = MODELS.filter((m) => !healthy.includes(m));
  return [...healthy, ...cooling];
}

let client: GoogleGenAI | null = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIError("GEMINI_API_KEY is not configured", 503);
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export class AIError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export const hasKey = () => Boolean(process.env.GEMINI_API_KEY);

/** Gemini accepts a JSON-Schema subset; drop keys it doesn't understand. */
function toGeminiSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  const clean = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(clean);
    if (!node || typeof node !== "object") return node;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$schema" || k === "additionalProperties") continue;
      if ((k === "minimum" || k === "maximum") && Math.abs(v as number) > 1e6) continue;
      out[k] = clean(v);
    }
    return out;
  };
  return clean(json);
}

const schemaCache = new WeakMap<z.ZodType, unknown>();

function safeJSON(text: string | undefined) {
  try {
    return JSON.parse(text ?? "");
  } catch {
    return undefined;
  }
}

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

/** Errors where moving down the chain makes sense (rate-limited, overloaded, retired). */
const isCapacityError = (err: unknown) => {
  const status = (err as { status?: number })?.status;
  return status === 404 || status === 429 || status === 500 || status === 503;
};

type GenerateOptions<T> = {
  thinking?: ThinkingLevel;
  /** Hard budget for the whole call, across models and retries. */
  deadlineMs?: number;
  /** Per-attempt cap, so a slow model leaves room for a fallback to answer. */
  attemptMs?: number;
  /** Quality gate: return a reason to reject a schema-valid result and retry while time allows. */
  check?: (data: T) => string | null;
};

export async function generateJSON<T extends z.ZodType>(
  schema: T,
  prompt: string,
  { thinking = "low", deadlineMs = 52_000, attemptMs = 20_000, check }: GenerateOptions<z.infer<T>> = {},
): Promise<z.infer<T>> {
  const ai = getClient();
  let responseJsonSchema = schemaCache.get(schema);
  if (!responseJsonSchema) {
    responseJsonSchema = toGeminiSchema(schema);
    schemaCache.set(schema, responseJsonSchema);
  }

  const deadline = Date.now() + deadlineMs;
  // Walk the chain; a model whose answer fails validation or the quality gate gets one more try.
  const attempts = modelOrder().flatMap((m) => [m, m]);
  let lastErr: unknown;
  /** Best schema-valid answer that failed the gate — used if time runs out. */
  let candidate: z.infer<T> | undefined;
  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i];
    const remaining = deadline - Date.now();
    if (remaining < 4_000 || (candidate !== undefined && remaining < attemptMs * 0.6)) break;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(remaining, attemptMs));
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseJsonSchema,
          abortSignal: controller.signal,
          ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: thinking as never } } : {}),
        },
      });
      const parsed = schema.safeParse(safeJSON(res.text));
      if (parsed.success) {
        coolingUntil.delete(model);
        const rejected = check?.(parsed.data);
        if (!rejected) {
          console.info(`[gemini] ${model} ok in ${Date.now() - started}ms`);
          return parsed.data;
        }
        candidate ??= parsed.data;
        lastErr = new Error(`quality gate: ${rejected}`);
        console.warn(`[gemini] ${model} rejected by quality gate: ${rejected}`);
        continue;
      }
      lastErr = parsed.error;
      console.warn(`[gemini] ${model} returned invalid JSON`);
    } catch (err) {
      lastErr = err;
      const timedOut = controller.signal.aborted;
      console.warn(`[gemini] ${model} failed:`, timedOut ? "timeout" : ((err as { status?: number })?.status ?? (err as Error)?.message));
      if (timedOut || isCapacityError(err)) {
        // Rate-limited, overloaded, slow or retired: cool it down and skip its second attempt.
        coolingUntil.set(model, Date.now() + (timedOut ? 15_000 : cooldownMs(err)));
        if (attempts[i + 1] === model) i++;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  if (candidate !== undefined) {
    console.warn("[gemini] returning best gated candidate:", (lastErr as Error)?.message);
    return candidate;
  }
  console.error("[gemini] all models failed:", lastErr);
  throw new AIError("The AI could not complete this request");
}

/** Shared route wrapper: validate body, run, map errors to JSON responses. */
export async function handle<Req extends z.ZodType, Res>(
  request: Request,
  reqSchema: Req,
  run: (body: z.infer<Req>) => Promise<Res>,
  fallback?: (body: z.infer<Req>) => Res | undefined,
) {
  let body: z.infer<Req>;
  try {
    const parsed = reqSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
    body = parsed.data;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    return Response.json({ data: await run(body) });
  } catch (err) {
    const fb = fallback?.(body);
    if (fb) return Response.json({ data: fb, fallback: true });
    const status = err instanceof AIError ? err.status : 500;
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status });
  }
}
