import { generateJSON, handle } from "@/lib/gemini";
import { analyzePrompt } from "@/lib/prompts";
import { Analysis, AnalyzeRequest } from "@/lib/schemas";
import { checkBalance, findVerdict, normalizeAnalysis } from "@/lib/guards";
import { DEMO_ANALYSIS } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    AnalyzeRequest,
    async ({ decision, context }) => {
      const source = `${decision}\n${context}`;
      const result = await generateJSON(Analysis, analyzePrompt(decision, context), {
        thinking: "low",
        attemptMs: 22_000,
        // Reject maps that lean (an option nobody examines) or slip into a verdict.
        check: (a) => checkBalance(normalizeAnalysis(a, source)) ?? (findVerdict(a) && "verdict language"),
      });
      return normalizeAnalysis(result, source);
    },
    (body) => (body.demo ? DEMO_ANALYSIS : undefined),
  );
}
