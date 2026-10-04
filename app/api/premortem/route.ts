import { generateJSON, handle } from "@/lib/gemini";
import { premortemPrompt } from "@/lib/prompts";
import { Premortem, PremortemRequest } from "@/lib/schemas";
import { DEMO_DECISION, DEMO_PREMORTEM } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    PremortemRequest,
    ({ decision, summary, story }) => generateJSON(Premortem, premortemPrompt(decision, summary, story)),
    (body) => (body.decision === DEMO_DECISION ? DEMO_PREMORTEM : undefined),
  );
}
