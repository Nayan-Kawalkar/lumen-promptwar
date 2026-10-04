import { generateJSON, handle } from "@/lib/gemini";
import { reflectPrompt } from "@/lib/prompts";
import { Reflection, ReflectRequest } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handle(request, ReflectRequest, (body) => generateJSON(Reflection, reflectPrompt(body)), (body) => ({
    reflection: "Your answer is saved. Sit with it for a moment — does it change how this part of the decision looks?",
    follow_up: "",
    insight: body.answer.slice(0, 90),
    asked_for_verdict: false,
  }));
}
