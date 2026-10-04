import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { SYSTEM } from "./prompts";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

export async function generateJSON<T extends z.ZodType>(
  schema: T,
  prompt: string,
  { temperature = 0.7, timeoutMs = 45_000 } = {},
): Promise<z.infer<T>> {
  const ai = getClient();
  let responseJsonSchema = schemaCache.get(schema);
  if (!responseJsonSchema) {
    responseJsonSchema = toGeminiSchema(schema);
    schemaCache.set(schema, responseJsonSchema);
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          temperature,
          responseMimeType: "application/json",
          responseJsonSchema,
          abortSignal: controller.signal,
        },
      });
      const parsed = schema.safeParse(JSON.parse(res.text ?? ""));
      if (parsed.success) return parsed.data;
      lastErr = parsed.error;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  console.error("[gemini] failed:", lastErr);
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
