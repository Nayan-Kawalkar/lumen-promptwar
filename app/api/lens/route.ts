import { generateJSON, handle } from "@/lib/gemini";
import { lensPrompt } from "@/lib/prompts";
import { Lenses, LensRequest } from "@/lib/schemas";
import { DEMO_DECISION, DEMO_LENSES } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    LensRequest,
    ({ decision, context, summary }) => generateJSON(Lenses, lensPrompt(decision, context, summary), { temperature: 0.8 }),
    (body) => (body.decision === DEMO_DECISION ? DEMO_LENSES : undefined),
  );
}
