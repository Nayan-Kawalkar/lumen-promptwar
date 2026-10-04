"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Loader2, Quote, Sparkles, X } from "lucide-react";
import { api, KIND_META, toExchanges, type MapNode } from "@/lib/client";
import { DIMENSION_LABELS, type Reflection } from "@/lib/schemas";

export function NodePanel({
  node,
  options,
  decision,
  summary,
  onUpdate,
  onClose,
  onNext,
  hasNext,
  onFallback,
}: {
  node: MapNode;
  options: string[];
  decision: string;
  summary: string;
  onUpdate: (id: string, patch: Partial<MapNode>) => void;
  onClose: () => void;
  onNext: () => void;
  hasNext: boolean;
  onFallback: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [verdictAsked, setVerdictAsked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = KIND_META[node.kind];
  const color = node.lit ? "var(--lit)" : meta.color;
  const question = node.thread.length === 0 ? node.question : node.next;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [node.thread.length]);

  const submit = async () => {
    if (!answer.trim() || !question || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, fallback } = await api<Reflection>("/api/reflect", {
        decision,
        summary,
        node: { kind: node.kind, title: node.title, insight: node.insight, quote: node.quote },
        history: toExchanges(node),
        question,
        answer: answer.trim(),
      });
      if (fallback) onFallback();
      const thread = [...node.thread, { question, answer: answer.trim(), reflection: data.reflection }];
      onUpdate(node.id, {
        thread,
        lit: true,
        seen: data.insight || node.seen,
        next: data.follow_up && thread.length < 3 ? data.follow_up : undefined,
      });
      setVerdictAsked(data.asked_for_verdict);
      setAnswer("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.aside
      key="panel"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="glass absolute inset-x-2 bottom-2 z-40 flex max-h-[72%] flex-col rounded-3xl shadow-2xl md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-[420px]"
      style={{ boxShadow: `0 0 80px -30px ${color}`, background: "rgba(9,10,20,0.94)" }}
      role="dialog"
      aria-label={`${meta.label}: ${node.title}`}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <span
          className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider"
          style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}
        >
          <span className="size-1.5 rounded-full" style={{ background: color }} />
          {node.lit ? "Illuminated" : meta.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="label hidden sm:inline">{DIMENSION_LABELS[node.dimension]}</span>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-text">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="mt-3 font-serif text-3xl leading-tight">{node.title}</h2>
        {options.length > 1 && (
          <p className="mt-1.5 text-xs text-muted">
            Examines: <span className="text-text/80">{node.about >= 0 ? options[node.about] : "every path"}</span>
          </p>
        )}

        {node.quote && (
          <div className="mt-4 flex gap-2.5 rounded-2xl border border-line bg-white/[0.02] p-3 text-sm text-text/80">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-muted" />
            <p>
              <span className="text-muted">You said: </span>&ldquo;{node.quote}&rdquo;
            </p>
          </div>
        )}

        <p className="mt-4 text-[15px] leading-relaxed text-text/85">{node.insight}</p>

        {/* thread */}
        <div className="mt-5 space-y-4">
          {node.thread.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <p className="font-serif text-lg italic leading-snug text-text/70">{t.question}</p>
              <p className="ml-6 rounded-2xl rounded-tr-sm bg-white/[0.05] p-3 text-sm text-text/90">{t.answer}</p>
              <div className="flex gap-2 rounded-2xl border p-3 text-sm leading-relaxed" style={{ borderColor: "color-mix(in oklab, var(--lit) 25%, transparent)", background: "color-mix(in oklab, var(--lit) 6%, transparent)" }}>
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-light" />
                <p className="text-text/90">{t.reflection}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {verdictAsked && (
          <p className="mt-3 rounded-xl bg-factor/10 p-3 text-xs text-factor">
            Lumen won&apos;t choose for you. But notice what you just asked for — what would you hope it said?
          </p>
        )}

        {node.lit && !question && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-lit/10 p-3.5 text-sm text-lit">
            <Check className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-medium">You can see this now.</span> {node.seen}
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <AnimatePresence mode="wait">
        {question ? (
          <motion.div
            key={question}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-t border-line px-5 pb-5 pt-4"
          >
            <p className="label mb-2" style={{ color }}>
              {node.thread.length ? "Go deeper" : "Ask yourself"}
            </p>
            <p className="font-serif text-xl leading-snug">{question}</p>
            <textarea
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              rows={3}
              maxLength={2000}
              placeholder="Think out loud. There's no wrong answer."
              className="mt-3 w-full resize-none rounded-2xl border border-line bg-black/30 p-3 text-sm text-text placeholder:text-muted/60 focus:border-light/40 focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-contradiction">{error}</p>}
            <div className="mt-3 flex items-center justify-between">
              {node.thread.length > 0 ? (
                <button onClick={() => onUpdate(node.id, { next: undefined })} className="text-xs text-muted hover:text-text">
                  I see it now
                </button>
              ) : (
                <span className="text-[11px] text-muted/60">Ctrl + Enter to send</span>
              )}
              <button
                onClick={submit}
                disabled={!answer.trim() || loading}
                className="inline-flex items-center gap-2 rounded-full bg-light px-5 py-2.5 text-sm font-medium text-ink transition disabled:opacity-30"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Shine a light
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-line p-4">
            <button
              onClick={hasNext ? onNext : onClose}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm text-text/90 transition hover:border-light/40"
            >
              {hasNext ? "Next thing in the dark" : "Back to the map"}
              <ArrowRight className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
