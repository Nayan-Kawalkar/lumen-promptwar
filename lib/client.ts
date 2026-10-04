import type { Analysis, Dimension, Exchange, NodeKind } from "./schemas";

export type ApiResult<T> = { data: T; fallback?: boolean };

export async function api<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.data) throw new Error(json.error || `Request failed (${res.status})`);
  return json as ApiResult<T>;
}

export type MapNode = Analysis["nodes"][number] & {
  id: string;
  discovered: boolean;
  lit: boolean;
  thread: { question: string; answer: string; reflection: string }[];
  /** Follow-up question waiting to be answered. */
  next?: string;
  /** What the user now sees, in a short phrase. */
  seen?: string;
};

export const toExchanges = (n: MapNode): Exchange[] => n.thread.map(({ question, answer }) => ({ question, answer }));

export type Session = {
  decision: string;
  context: string;
  demo: boolean;
  analysis: Analysis;
  nodes: MapNode[];
};

export const KIND_META: Record<NodeKind | "factor", { label: string; color: string; hint: string }> = {
  factor: { label: "What you see", color: "var(--factor)", hint: "Reasons you're already weighing" },
  assumption: { label: "Hidden assumption", color: "var(--assumption)", hint: "Beliefs your reasons quietly rely on" },
  blindspot: { label: "Blind spot", color: "var(--blindspot)", hint: "What you haven't mentioned at all" },
  contradiction: { label: "Contradiction", color: "var(--contradiction)", hint: "Where your reasons pull against each other" },
};

export function toMapNodes(analysis: Analysis): MapNode[] {
  return analysis.nodes.map((n, i) => ({ ...n, id: `n${i}`, discovered: false, lit: false, thread: [] }));
}

/** 0-100. Starts at what the user already covered, rises as nodes are illuminated. */
export function visibility(analysis: Analysis, nodes: MapNode[]) {
  const base = analysis.coverage.reduce((s, c) => s + c.score, 0) / Math.max(1, analysis.coverage.length);
  const total = nodes.reduce((s, n) => s + n.severity, 0) || 1;
  const gained = nodes.reduce((s, n) => s + (n.lit ? n.severity : n.discovered ? n.severity * 0.15 : 0), 0);
  return Math.min(100, Math.round(base + (100 - base) * (gained / total)));
}

export function dimensionScores(analysis: Analysis, nodes: MapNode[]) {
  return analysis.coverage.map(({ dimension, score }) => {
    const inDim = nodes.filter((n) => n.dimension === dimension);
    const total = inDim.reduce((s, n) => s + n.severity, 0);
    const lit = inDim.reduce((s, n) => s + (n.lit ? n.severity : 0), 0);
    return { dimension: dimension as Dimension, score: total ? Math.round(score + (100 - score) * (lit / total)) : score };
  });
}
