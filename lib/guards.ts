import type { Analysis } from "./schemas";

/**
 * Directive phrasing that would mean Lumen is deciding for the user.
 * Deliberately narrow: "you should" alone is fine inside a question ("what do you feel you should…").
 */
const VERDICT =
  /\b(you should (definitely |really |probably |just )?(take|accept|decline|reject|go|do|stay|leave|quit|drop|pivot|choose|end|break|move|sign|join)\b|i(?: would|'d|’d)? (?:strongly )?recommend|i suggest (that )?you|my (honest )?(advice|recommendation|verdict)|the (best|right|smart|wise|wiser|better) (choice|option|decision|move|path) (is|would be|here is)|go for it|don'?t do it|you must (take|accept|decline|choose|go|leave)|if i (were|was) you|if i said ['"“]?(yes|no))/i;

/** Fields that hold the user's own words — they may say anything; we never flag the user. */
const USER_WORDS = new Set(["quote", "evidence"]);

/** First AI-authored string anywhere in the value that reads like a verdict, or null. */
export function findVerdict(value: unknown): string | null {
  if (typeof value === "string") return VERDICT.test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const hit = findVerdict(v);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (USER_WORDS.has(k)) continue;
      const hit = findVerdict(v);
      if (hit) return hit;
    }
  }
  return null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[“”"‘’'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Keep a quote only if it really is the user's words; salvage the first fragment of "a ... b" quotes. */
export function verifyQuote(quote: string, source: string): string {
  const q = quote.trim();
  // Never put directive text on screen as a "quote" (e.g. injected "you should accept").
  if (!q || VERDICT.test(q)) return "";
  const src = norm(source);
  if (src.includes(norm(q))) return q;
  const first = q.split(/\.\.\.|…/)[0]?.trim();
  if (first && first.length >= 8 && src.includes(norm(first))) return first;
  return "";
}

/** Repair indices and quotes so the map can render safely and only ever shows real user words. */
export function normalizeAnalysis(a: Analysis, source: string): Analysis {
  const options = a.options.filter((o) => o.trim()).slice(0, 3);
  return {
    ...a,
    options,
    factors: a.factors.map((f) => ({ ...f, quote: verifyQuote(f.quote, source) })),
    nodes: a.nodes.map((n) => ({
      ...n,
      quote: verifyQuote(n.quote, source),
      factor: n.factor >= 0 && n.factor < a.factors.length ? n.factor : -1,
      about: n.about >= 0 && n.about < options.length ? n.about : -1,
      severity: Math.min(3, Math.max(1, n.severity)),
    })),
  };
}

/** Quality gate for the map: every option must have something examined about it. */
export function checkBalance(a: Analysis): string | null {
  if (a.options.length < 2) return "fewer than two options";
  const missing = a.options.filter((_, i) => !a.nodes.some((n) => n.about === i));
  if (missing.length) return `no node examines option(s): ${missing.join(", ")}`;
  if (a.nodes.length < 6) return `only ${a.nodes.length} nodes`;
  return null;
}
