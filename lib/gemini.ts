import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { SYSTEM } from "./prompts";

/** Comma-separated fallback chain; the first healthy model wins. */
const MODELS = (process.env.GEMINI_MODEL || "gemini-3-flash-preview,gemini-3.8-flash,gemini-3.5-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

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

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

/** Errors where trying the next model makes sense (overloaded, rate-limited, retired). */
const isSkippable = (err: unknown) => {
  const status = (err as { status?: number })?.status;
  return status === 404 || status === 429 || status === 500 || status === 503;
};

export async function generateJSON<T extends z.ZodType>(
  schema: T,
  prompt: string,
  { thinking = "low" as ThinkingLevel, deadlineMs = 50_000 } = {},
): Promise<z.infer<T>> {
  const ai = getClient();
  let responseJsonSchema = schemaCache.get(schema);
  if (!responseJsonSchema) {
    responseJsonSchema = toGeminiSchema(schema);
    schemaCache.set(schema, responseJsonSchema);
  }

  const deadline = Date.now() + deadlineMs;
  // Walk the model chain; an invalid response gets one more try on the same model.
  const attempts = MODELS.flatMap((m) => [m, m]);
  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i];
    const remaining = deadline - Date.now();
    if (remaining < 4_000) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(remaining, 35_000));
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
      const parsed = schema.safeParse(JSON.parse(res.text ?? ""));
      if (parsed.success) return parsed.data;
      lastErr = parsed.error;
      console.warn(`[gemini] ${model} returned invalid JSON`);
    } catch (err) {
      lastErr = err;
      console.warn(`[gemini] ${model} failed:`, (err as { status?: number })?.status ?? (err as Error)?.message);
      // overloaded / retired model → skip its second attempt and move down the chain
      if (isSkippable(err) && attempts[i + 1] === model) i++;
    } finally {
      clearTimeout(timer);
    }
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
