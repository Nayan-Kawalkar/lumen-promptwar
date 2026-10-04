"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Clock, Compass, HeartHandshake, Swords } from "lucide-react";
import type { Lenses } from "@/lib/schemas";

const LENS_META = {
  future: { name: "Future You", sub: "one year later", icon: Clock, color: "var(--light)" },
  skeptic: { name: "The Skeptic", sub: "friendly devil's advocate", icon: Swords, color: "var(--contradiction)" },
  mentor: { name: "The Mentor", sub: "has seen this before", icon: Compass, color: "var(--factor)" },
  affected: { name: "The Affected", sub: "someone this touches", icon: HeartHandshake, color: "var(--blindspot)" },
} as const;

export function LensDeck({
  lenses,
  notes,
  onNote,
}: {
  lenses: Lenses | null;
  notes: Record<string, string>;
  onNote: (id: string, v: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <div className="text-center">
        <p className="label mb-3">Step 3 · Lenses</p>
        <h2 className="font-serif text-4xl md:text-5xl">
          Borrow someone else&apos;s <span className="italic text-light">eyes</span>.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Each lens sees a different part of the dark. Flip one open, read its questions, and jot down whatever surfaces.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(lenses?.lenses ?? Object.keys(LENS_META).map((id) => ({ id, voice: "", questions: [] as string[] }))).map(
          (l, i) => {
            const meta = LENS_META[l.id as keyof typeof LENS_META];
            const Icon = meta.icon;
            const isOpen = open === l.id;
            const loading = !lenses;
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 24, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass relative flex min-h-[340px] flex-col overflow-hidden rounded-3xl p-5"
                style={{ boxShadow: isOpen ? `0 0 70px -25px ${meta.color}` : undefined }}
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 size-40 rounded-full blur-3xl"
                  style={{ background: meta.color, opacity: isOpen ? 0.25 : 0.1 }}
                />
                <div className="relative flex items-center gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-2xl"
                    style={{ background: `color-mix(in oklab, ${meta.color} 15%, transparent)`, color: meta.color }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-serif text-2xl leading-none">{meta.name}</p>
                    <p className="label mt-1 !text-[9px]">{meta.sub}</p>
                  </div>
                </div>

                {loading ? (
                  <div className="relative mt-6 space-y-3">
                    {[0, 1, 2, 3].map((k) => (
                      <div key={k} className="h-3 animate-pulse rounded bg-white/5" style={{ width: `${90 - k * 12}%` }} />
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="relative mt-5 font-serif text-lg italic leading-snug text-text/85">&ldquo;{l.voice}&rdquo;</p>
                    {isOpen ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mt-4 flex flex-1 flex-col">
                        <ol className="space-y-2.5 text-sm text-text/90">
                          {l.questions.map((q, k) => (
                            <li key={k} className="flex gap-2">
                              <span className="font-mono text-xs" style={{ color: meta.color }}>
                                0{k + 1}
                              </span>
                              {q}
                            </li>
                          ))}
                        </ol>
                        <textarea
                          value={notes[l.id] ?? ""}
                          onChange={(e) => onNote(l.id, e.target.value)}
                          rows={3}
                          maxLength={1500}
                          placeholder="What surfaced for you?"
                          className="mt-4 w-full resize-none rounded-2xl border border-line bg-black/30 p-3 text-sm placeholder:text-muted/60 focus:border-light/40 focus:outline-none"
                        />
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setOpen(l.id)}
                        className="relative mt-auto rounded-full border border-line py-2.5 text-sm text-text/80 transition hover:border-white/25"
                      >
                        {notes[l.id] ? "Reopen ✓" : "Look through this lens"}
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            );
          },
        )}
      </div>
    </div>
  );
}
