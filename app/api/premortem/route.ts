import { generateJSON, handle } from "@/lib/gemini";
import { premortemPrompt } from "@/lib/prompts";
import { Premortem, PremortemRequest } from "@/lib/schemas";
import { findVerdict } from "@/lib/guards";
import { DEMO_DECISION, DEMO_PREMORTEM } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    PremortemRequest,
    ({ decision, summary, path, story }) =>
      generateJSON(Premortem, premortemPrompt(decision, summary, path, story), {
        thinking: "low",
        attemptMs: 15_000,
        check: (p) => (findVerdict(p) ? "verdict language" : null),
      }),
    (body) => (body.decision === DEMO_DECISION ? DEMO_PREMORTEM : undefined),
  );
}
