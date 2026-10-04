# Lumen — an AI flashlight for your reasoning

> **PromptWars · Challenge: THE BLIND SPOT**
> People decide based on what's most visible to them. Lumen helps them see the rest — and never decides for them.

## The idea

Your reasoning about a decision is a dark room. You can see the reasons you're already weighing, but the assumptions under them, the factors you never mentioned, and the places where your own reasons contradict each other are all hidden in the dark.

Lumen hands you a flashlight.

1. **Describe.** Type your decision and why you're leaning that way, or speak it with voice input.
2. **Scan.** Gemini maps your reasoning into a **Thought Constellation**:
   - **Cyan:** what you already see, the reasons you stated (quoted back to you)
   - **Amber:** hidden assumptions your reasons quietly depend on
   - **Violet:** blind spots, dimensions you never mentioned
   - **Red, pulsing:** contradictions between things you said
3. **Illuminate.** The map starts in fog. Move your cursor (or tap) to sweep the flashlight and *discover* what's hidden. Each thought opens one Socratic question. When you answer, Lumen reflects back what your answer reveals, may ask one deeper follow-up, and the thought **lights up**. Your **Visibility score** rises as you examine more of the decision.
4. **Lenses.** Look at the decision through four other sets of eyes: *Future You (1 year later)*, *The Skeptic*, *The Mentor*, and *The Person Most Affected*. Each lens gives you questions, never advice.
5. **Pre-mortem.** "It's six months from now and it went badly. What happened?" Lumen finds the failure patterns and the hidden fear in your own story.
6. **Clarity Report.** Lumen summarises what you value, what you examined, the tensions you're holding, the questions still in the dark, and the facts worth finding out. It ends with *the decision is yours*. You can save it as a PDF or copy it as text.

## Designed to never decide

- The system prompt forbids recommending, ranking, or choosing. The model is restricted to questions and reflection.
- If the user asks "just tell me what to do", the model flags `asked_for_verdict` and the UI gently hands the question back.
- Everything is grounded in the user's own words. Every node carries the quote it came from.

## Meaningful AI

- **Structured reasoning extraction.** Gemini returns typed JSON (enforced with a JSON Schema and validated with zod): factors, assumptions, blind spots, contradictions, severity, a link to the related factor, and coverage across 9 decision dimensions (time, true cost, growth, career, wellbeing, people affected, opportunity cost, values, and reversibility).
- **Adaptive Socratic dialogue.** Each answer is analysed in the context of the thread, which produces a reflection, an optional deeper follow-up, and a short "what you now see" insight.
- **Perspective simulation** (lenses), **pre-mortem pattern analysis**, and **session synthesis** (the Clarity Report).

## Tech

- **Next.js 16** (App Router, TypeScript) with Route Handlers as the API layer
- **Google Gemini** (`gemini-2.5-flash`) via `@google/genai`, using `responseJsonSchema` structured output
- **Tailwind CSS v4** and **Motion** for animation. The constellation is an SVG/HTML layer with a CSS-mask fog and a flashlight that follows the pointer.
- **zod** validates every request and response. Input length limits are enforced and the API key stays server-only.
- Accessibility: a keyboard-reachable map, a List view alternative, `prefers-reduced-motion` support, and a responsive layout with tap-to-reveal on mobile.
- Resilience: one automatic retry plus a timeout on every model call. A cached demo response keeps the internship example working even if the API is rate-limited.

## Run locally

```bash
cd lumen
cp .env.example .env.local   # add your GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm install
npm run dev
```

## Deploy (Vercel)

1. Import the GitHub repo in Vercel. The framework is detected automatically.
2. Add the `GEMINI_API_KEY` environment variable. `GEMINI_MODEL` is optional.
3. Deploy.
