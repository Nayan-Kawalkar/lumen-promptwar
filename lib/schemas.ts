import { z } from "zod";

export const DIMENSIONS = [
  "time",
  "money",
  "growth",
  "career",
  "wellbeing",
  "relationships",
  "opportunity",
  "values",
  "risk",
] as const;

export const DIMENSION_LABELS: Record<(typeof DIMENSIONS)[number], string> = {
  time: "Time & Commitments",
  money: "True Cost",
  growth: "Learning & Growth",
  career: "Long-term Career",
  wellbeing: "Health & Energy",
  relationships: "People Affected",
  opportunity: "Opportunity Cost",
  values: "Values & Motives",
  risk: "Risk & Reversibility",
};

export const Dimension = z.enum(DIMENSIONS);
export type Dimension = z.infer<typeof Dimension>;

/* ---------- Requests ---------- */

export const AnalyzeRequest = z.object({
  decision: z.string().trim().min(3).max(300),
  context: z.string().trim().min(10).max(4000),
  demo: z.boolean().optional(),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequest>;

const Exchange = z.object({
  question: z.string().max(600),
  answer: z.string().max(2000),
});
export type Exchange = z.infer<typeof Exchange>;

export const ReflectRequest = z.object({
  decision: z.string().max(300),
  summary: z.string().max(1200),
  node: z.object({
    kind: z.string().max(40),
    title: z.string().max(200),
    insight: z.string().max(800),
    quote: z.string().max(600),
  }),
  history: z.array(Exchange).max(6),
  question: z.string().max(600),
  answer: z.string().trim().min(1).max(2000),
});
export type ReflectRequest = z.infer<typeof ReflectRequest>;

const SessionContext = z.object({
  decision: z.string().max(300),
  context: z.string().max(4000),
  summary: z.string().max(1200),
});

const Options = z.array(z.string().max(80)).max(4).default([]);

export const LensRequest = SessionContext.extend({
  options: Options,
  covered: z.array(z.string().max(300)).max(20).default([]),
});

export const PremortemRequest = SessionContext.extend({
  path: z.string().max(80).default(""),
  story: z.string().trim().min(5).max(2500),
});

export const ReportRequest = SessionContext.extend({
  options: Options,
  explored: z
    .array(
      z.object({
        kind: z.string().max(40),
        title: z.string().max(200),
        exchanges: z.array(Exchange).max(6),
      }),
    )
    .max(30),
  unexplored: z.array(z.string().max(200)).max(30),
  premortem: z.string().max(2500).optional(),
});
export type ReportRequest = z.infer<typeof ReportRequest>;

/* ---------- AI responses ---------- */

export const NodeKind = z.enum(["assumption", "blindspot", "contradiction"]);
export type NodeKind = z.infer<typeof NodeKind>;

export const Analysis = z.object({
  title: z
    .string()
    .describe("The decision restated as a short neutral question, max 10 words."),
  summary: z
    .string()
    .describe("One or two sentences mirroring the user's reasoning back, neutrally, in second person."),
  options: z
    .array(z.string().describe("2-5 word neutral label for one path, e.g. 'Take the internship'."))
    .describe("The 2-3 paths in play. Always include the not-doing-it / status-quo path."),
  factors: z
    .array(
      z.object({
        label: z.string().describe("2-4 plain words for a reason or constraint the user explicitly gave."),
        quote: z.string().describe("Exact words copied from the user's text."),
      }),
    )
    .describe("Every reason or constraint the user is consciously weighing, on any side. 2-6 items."),
  nodes: z
    .array(
      z.object({
        kind: NodeKind,
        title: z.string().describe("Punchy 2-5 word label."),
        insight: z
          .string()
          .describe("1-2 sentences on why this might matter for THIS person. No advice, no verdict, no loaded words."),
        quote: z
          .string()
          .describe("Exact words copied from the user's text that this is grounded in. Empty string if they never mentioned it."),
        question: z
          .string()
          .describe("One open, specific, Socratic question. Not yes/no, does not assume which option they choose."),
        dimension: Dimension,
        severity: z.number().int().min(1).max(3).describe("1 = minor, 3 = could change how the decision looks."),
        factor: z
          .number()
          .int()
          .describe("Index into factors[] this node most directly questions, or -1."),
        about: z
          .number()
          .int()
          .describe("Index into options[] of the path this node examines, or -1 if it applies to every path."),
      }),
    )
    .describe("4-5 hidden assumptions, 4-5 blind spots, 0-2 real contradictions. Each option examined by at least 2 nodes."),
  coverage: z
    .array(
      z.object({
        dimension: Dimension,
        score: z.number().int().min(0).max(100).describe("How much the user's own reasoning already covers this."),
      }),
    )
    .describe("One entry for every dimension."),
});
export type Analysis = z.infer<typeof Analysis>;

export const Reflection = z.object({
  reflection: z
    .string()
    .describe("1-2 sentences reflecting back what their answer reveals. Warm, precise, no advice, no verdict."),
  follow_up: z
    .string()
    .describe("One deeper follow-up question, or empty string if they have clearly examined this."),
  insight: z
    .string()
    .describe("Max 14 words: the user's own first-person realisation, in their words. Never a judgement of them."),
  asked_for_verdict: z.boolean().describe("True if the user asked the AI to decide for them."),
});
export type Reflection = z.infer<typeof Reflection>;

export const LENS_IDS = ["future", "skeptic", "mentor", "affected"] as const;

export const Lenses = z.object({
  lenses: z
    .array(
      z.object({
        id: z.enum(LENS_IDS),
        voice: z
          .string()
          .describe("One sentence spoken in this persona's voice framing what they'd want examined. No advice."),
        questions: z.array(z.string()).describe("Exactly 3 sharp questions from this perspective."),
      }),
    )
    .describe("Exactly four lenses: future, skeptic, mentor, affected."),
});
export type Lenses = z.infer<typeof Lenses>;

export const Premortem = z.object({
  patterns: z
    .array(
      z.object({
        pattern: z.string().describe("A failure pattern in their story, 3-8 words."),
        evidence: z.string().describe("The part of their story that shows it."),
      }),
    )
    .describe("2-3 patterns."),
  hidden_fear: z.string().describe("One sentence naming the worry that seems to sit underneath the story, gently."),
  signals: z.array(z.string()).describe("2-3 early signals they could watch for, phrased as observations."),
  question: z.string().describe("One question this pre-mortem raises about the decision itself."),
});
export type Premortem = z.infer<typeof Premortem>;

export const Report = z.object({
  headline: z.string().describe("A neutral one-line title for what they now see. Never a recommendation."),
  valued: z.array(z.string()).describe("What they seem to value most, in their words. 2-4 items."),
  examined: z
    .array(z.object({ belief: z.string(), finding: z.string() }))
    .describe("Assumptions or blind spots they examined and what they found. Up to 6."),
  tensions: z.array(z.string()).describe("Tensions they are holding. 0-3 items."),
  open_questions: z.array(z.string()).describe("Important questions still unanswered. 2-5 items."),
  info_to_gather: z
    .array(z.string())
    .describe("Concrete facts they could go find out before deciding (who to ask, what to check). 2-4 items."),
  closing: z
    .string()
    .describe("One sentence naming what matters on each side in equal terms and handing the decision back. Never lean."),
});
export type Report = z.infer<typeof Report>;
