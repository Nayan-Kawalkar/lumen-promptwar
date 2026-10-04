import { generateJSON, handle } from "@/lib/gemini";
import { analyzePrompt } from "@/lib/prompts";
import { Analysis, AnalyzeRequest } from "@/lib/schemas";
import { DEMO_ANALYSIS } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    AnalyzeRequest,
    async ({ decision, context }) => {
      const result = await generateJSON(Analysis, analyzePrompt(decision, context), { thinking: "low" });
      // Keep factor references valid so the map can draw threads safely.
      result.nodes = result.nodes.map((n) => ({
        ...n,
        factor: n.factor >= 0 && n.factor < result.factors.length ? n.factor : -1,
      }));
      return result;
    },
    (body) => (body.demo ? DEMO_ANALYSIS : undefined),
  );
}
