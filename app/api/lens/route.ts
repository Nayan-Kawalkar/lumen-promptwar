import { generateJSON, handle } from "@/lib/gemini";
import { lensPrompt } from "@/lib/prompts";
import { Lenses, LensRequest } from "@/lib/schemas";
import { findVerdict } from "@/lib/guards";
import { DEMO_DECISION, DEMO_LENSES } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    LensRequest,
    ({ decision, context, summary, options, covered }) =>
      generateJSON(Lenses, lensPrompt(decision, context, summary, options, covered), {
        thinking: "low",
        attemptMs: 15_000,
        check: (l) =>
          findVerdict(l) ? "verdict language" : l.lenses.length < 4 ? `only ${l.lenses.length} lenses` : null,
      }),
    (body) => (body.decision === DEMO_DECISION ? DEMO_LENSES : undefined),
  );
}
