import { generateJSON, handle } from "@/lib/gemini";
import { reportPrompt } from "@/lib/prompts";
import { Report, ReportRequest } from "@/lib/schemas";
import { findVerdict } from "@/lib/guards";
import { DEMO_DECISION, DEMO_REPORT } from "@/lib/demo";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(
    request,
    ReportRequest,
    (body) =>
      generateJSON(Report, reportPrompt(body), {
        thinking: "low",
        attemptMs: 15_000,
        check: (r) => (findVerdict(r) ? "verdict language" : null),
      }),
    (body) => (body.decision === DEMO_DECISION ? DEMO_REPORT : undefined),
  );
}
