"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Eye, Loader2, Sparkles } from "lucide-react";
import type { Premortem } from "@/lib/schemas";

export function PreMortem({
  story,
  result,
  onStory,
  onRun,
  loading,
  error,
}: {
  story: string;
  result: Premortem | null;
  onStory: (v: string) => void;
  onRun: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="mx-auto w-full max-w-3xl px-5">
      <div className="text-center">
        <p className="label mb-3">Step 4 · Pre-mortem</p>
        <h2 className="font-serif text-4xl leading-tight md:text-5xl">
          It&apos;s six months from now.
          <br />
          <span className="italic text-contradiction/90">It went badly.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
          Don&apos;t argue with it — just tell the story. What happened? Psychologists call this a pre-mortem: imagining
          failure makes hidden risks easier to see.
        </p>
      </div>

      <div
        className="glass mt-8 rounded-3xl p-2 transition"
        style={{ boxShadow: focused ? "0 0 90px -30px var(--contradiction)" : undefined }}
      >
        <textarea
          value={story}
          onChange={(e) => onStory(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={5}
          maxLength={2500}
          placeholder="Looking back, it went wrong because…"
          className="w-full resize-none bg-transparent p-4 text-[15px] leading-relaxed placeholder:text-muted/60 focus:outline-none"
        />
        <div className="flex justify-end p-2">
          <button
            onClick={onRun}
            disabled={story.trim().length < 5 || loading}
            className="inline-flex items-center gap-2 rounded-full bg-light px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-30"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            {result ? "Read it again" : "What does my story reveal?"}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-center text-sm text-contradiction">{error}</p>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="glass rounded-3xl p-5 md:col-span-2">
            <p className="label mb-2 text-blindspot">Underneath the story</p>
            <p className="font-serif text-2xl leading-snug">{result.hidden_fear}</p>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="label mb-3">Patterns in your story</p>
            <ul className="space-y-3">
              {result.patterns.map((p, i) => (
                <li key={i}>
                  <p className="text-sm font-medium text-assumption">{p.pattern}</p>
                  <p className="text-sm text-muted">{p.evidence}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="label mb-3">Early signals you could watch</p>
            <ul className="space-y-2 text-sm text-text/90">
              {result.signals.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-factor" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 rounded-3xl border border-light/20 bg-light/5 p-5 md:col-span-2">
            <Sparkles className="mt-1 size-4 shrink-0 text-light" />
            <p className="font-serif text-xl italic leading-snug">{result.question}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
