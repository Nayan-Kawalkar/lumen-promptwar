// Temporary local benchmark — not committed.
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Analysis } from "./lib/schemas.ts";
import { SYSTEM, analyzePrompt } from "./lib/prompts.ts";
import { DEMO_CONTEXT, DEMO_DECISION } from "./lib/demo.ts";

const apiKey = readFileSync(".env.local", "utf8").match(/GEMINI_API_KEY=(.+)/)![1].trim();
const ai = new GoogleGenAI({ apiKey });
const clean = (n: any): any =>
  Array.isArray(n)
    ? n.map(clean)
    : n && typeof n === "object"
      ? Object.fromEntries(
          Object.entries(n)
            .filter(([k, v]) => k !== "$schema" && k !== "additionalProperties" && !((k === "minimum" || k === "maximum") && Math.abs(v as number) > 1e6))
            .map(([k, v]) => [k, clean(v)]),
        )
      : n;
const schema = clean(z.toJSONSchema(Analysis, { target: "draft-7" }));
const [thinking, ...models] = process.argv.slice(2);

await Promise.all(
  models.map(async (model) => {
    const t = Date.now();
    try {
      const r = await ai.models.generateContent({
        model,
        contents: analyzePrompt(DEMO_DECISION, DEMO_CONTEXT),
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          ...(thinking !== "default" ? { thinkingConfig: { thinkingLevel: thinking as any } } : {}),
        },
      });
      const p = Analysis.safeParse(JSON.parse(r.text ?? ""));
      const d: any = p.success ? p.data : null;
      console.log(`\n=== ${model} [thinking=${thinking}] ${Date.now() - t}ms valid=${p.success} thoughts=${r.usageMetadata?.thoughtsTokenCount} out=${r.usageMetadata?.candidatesTokenCount}`);
      if (!p.success) console.log(String(p.error).slice(0, 500));
      else {
        console.log("title:", d.title);
        console.log("factors:", d.factors.map((f: any) => f.label).join(" | "));
        for (const n of d.nodes) console.log(` [${n.kind}/${n.dimension}/s${n.severity}/f${n.factor}] ${n.title} — Q: ${n.question}`);
      }
    } catch (e: any) {
      console.log(`\n=== ${model} ERR ${e.status} ${String(e.message).slice(0, 200)}`);
    }
  }),
);
