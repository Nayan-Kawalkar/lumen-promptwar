"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, RefreshCw } from "lucide-react";

/** Where the user stands: which option they lean toward (null = genuinely unsure) and how sure they are. */
export type Stance = { lean: number | null; sure: number };

const sureLabel = (v: number) =>
  v < 30 ? "Not sure at all" : v < 55 ? "Somewhat unsure" : v < 80 ? "Fairly sure" : "Very sure";

export function CheckIn({
  phase,
  options,
  onDone,
  onSkip,
}: {
  phase: "before" | "after";
  options: string[];
  onDone: (s: Stance) => void;
  onSkip: () => void;
}) {
  // Both phases start neutral on purpose, so the "after" answer isn't anchored to the "before" one.
  const [lean, setLean] = useState<number | null | undefined>(undefined);
  const [sure, setSure] = useState(50);
  const firstRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef(onSkip);
  const before = phase === "before";

  useEffect(() => {
    skipRef.current = onSkip;
  });

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skipRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choices: { label: string; value: number | null }[] = [
    ...options.map((o, i) => ({ label: o, value: i })),
    { label: "Genuinely unsure", value: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="no-print fixed inset-0 z-[65] grid place-items-center bg-ink/70 px-4 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="glass w-full max-w-md rounded-3xl p-6 shadow-[0_40px_140px_-40px_rgba(255,214,140,0.45)]"
        style={{ background: "rgba(9,10,20,0.94)" }}
      >
        <p className="label text-light/80">{before ? "Before you look into the dark" : "Now that you've seen more"}</p>
        <h2 id="checkin-title" className="mt-2 font-serif text-3xl leading-tight">
          {before ? "Where do you stand right now?" : "Where do you stand now?"}
        </h2>

        <p className="mt-5 text-sm text-text/80">Which way are you leaning?</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Which way are you leaning">
          {choices.map((c, i) => {
            const active = lean === c.value;
            return (
              <button
                key={c.label}
                ref={i === 0 ? firstRef : undefined}
                role="radio"
                aria-checked={active}
                onClick={() => setLean(c.value)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  active ? "border-light/70 bg-light/15 text-text" : "border-line text-muted hover:text-text"
                } ${c.value === null ? "italic" : ""}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <label htmlFor="sure" className="text-sm text-text/80">
            How sure are you?
          </label>
          <span className="font-mono text-2xl tabular-nums text-light">{sure}%</span>
        </div>
        <input
          id="sure"
          type="range"
          min={0}
          max={100}
          step={5}
          value={sure}
          onChange={(e) => setSure(Number(e.target.value))}
          aria-valuetext={`${sure}% — ${sureLabel(sure)}`}
          className="mt-2 w-full accent-[var(--light)]"
        />
        <p className="mt-1 text-right text-xs text-muted">{sureLabel(sure)}</p>

        <p className="mt-5 text-xs leading-relaxed text-muted">
          {before
            ? "Lumen won't try to change this. It's a mirror you'll look back at in your Clarity Report."
            : "There's no right answer. Moving, or staying exactly where you were, are both fine."}
        </p>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={onSkip} className="text-xs text-muted hover:text-text">
            Skip
          </button>
          <button
            onClick={() => lean !== undefined && onDone({ lean, sure })}
            disabled={lean === undefined}
            className="inline-flex items-center gap-2 rounded-full bg-light px-5 py-2.5 text-sm font-medium text-ink transition disabled:opacity-30"
          >
            {before ? "Start exploring" : "Show my Clarity Report"} <ArrowRight className="size-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const leanName = (options: string[], lean: number | null) => (lean === null ? "unsure" : (options[lean] ?? "unsure"));

/** Neutral one-line read of how the user's stance moved. Never frames a direction as better. */
export function describeShift(options: string[], before: Stance, after: Stance) {
  const b = leanName(options, before.lean);
  const a = leanName(options, after.lean);
  const lean =
    before.lean === after.lean
      ? before.lean === null
        ? "You're still genuinely unsure"
        : `Your lean stayed with "${a}"`
      : before.lean === null
        ? `You came in unsure and now lean toward "${a}"`
        : after.lean === null
          ? `You came in leaning toward "${b}" and now feel genuinely unsure`
          : `Your lean moved from "${b}" to "${a}"`;
  const d = after.sure - before.sure;
  const sure =
    d > 0
      ? `and you're more sure than before, now with more of the picture in view.`
      : d < 0
        ? `and you're less certain, which often happens when hidden parts of a decision come into view.`
        : `with the same certainty, now resting on more of what you can see.`;
  return `${lean}, ${sure}`;
}

export function CertaintyShift({
  options,
  before,
  after,
  startVisibility,
  visibility,
  onUpdate,
}: {
  options: string[];
  before: Stance;
  after: Stance;
  startVisibility: number;
  visibility: number;
  onUpdate: () => void;
}) {
  const delta = after.sure - before.sure;
  const rows = [
    { label: "Certainty", from: `${before.sure}%`, to: `${after.sure}%`, note: delta ? `${delta > 0 ? "+" : ""}${delta}` : "±0" },
    { label: "Visibility", from: `${startVisibility}%`, to: `${visibility}%`, note: `+${Math.max(0, visibility - startVisibility)}` },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="print-card glass mt-8 rounded-3xl p-6"
      aria-label="How your stance shifted"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label text-light/80">Certainty shift</p>
        <button onClick={onUpdate} className="no-print inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
          <RefreshCw className="size-3" /> Update
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line p-4">
          <p className="label !text-[9px]">Leaning</p>
          <p className="mt-2 text-sm text-muted">{leanName(options, before.lean)}</p>
          <p className="text-muted">↓</p>
          <p className="font-serif text-xl leading-tight text-text">{leanName(options, after.lean)}</p>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl border border-line p-4">
            <p className="label !text-[9px]">{r.label}</p>
            <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-lg text-muted">{r.from}</span>
              <span className="text-muted">→</span>
              <span className="text-3xl text-light">{r.to}</span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted">{r.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2" aria-hidden>
        {[
          { v: before.sure, c: "rgba(255,255,255,0.18)", t: "Before" },
          { v: after.sure, c: "var(--light)", t: "Now" },
        ].map((b) => (
          <div key={b.t} className="flex items-center gap-3">
            <span className="label w-12 !text-[9px]">{b.t}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: b.c }}
                initial={{ width: 0 }}
                animate={{ width: `${b.v}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 font-serif text-xl italic leading-snug text-text/90">{describeShift(options, before, after)}</p>
      <p className="mt-2 text-xs text-muted">Lumen doesn&apos;t aim to change your mind, only how much of the room you can see.</p>
    </motion.section>
  );
}
