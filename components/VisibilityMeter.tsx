"use client";

import { useEffect, useState } from "react";
import { animate, AnimatePresence, motion } from "motion/react";
import { DIMENSION_LABELS, type Dimension } from "@/lib/schemas";

export function VisibilityMeter({
  value,
  dimensions,
}: {
  value: number;
  dimensions: { dimension: Dimension; score: number }[];
}) {
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = animate(shown, value, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const R = 20;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4"
        title="How much of this decision you can currently see"
      >
        <svg viewBox="0 0 48 48" className="size-10 -rotate-90">
          <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r={R}
            fill="none"
            stroke="var(--light)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - shown / 100)}
            style={{ filter: "drop-shadow(0 0 6px rgba(255,214,140,0.7))", transition: "stroke-dashoffset 0.2s" }}
          />
        </svg>
        <span className="text-left">
          <span className="block font-mono text-lg leading-none tabular-nums text-light">{shown}%</span>
          <span className="label !text-[9px]">Visibility</span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl p-4"
          >
            <p className="label mb-3">What your reasoning covers</p>
            <div className="space-y-2.5">
              {dimensions.map((d) => (
                <div key={d.dimension}>
                  <div className="flex justify-between text-xs text-text/80">
                    <span>{DIMENSION_LABELS[d.dimension]}</span>
                    <span className="font-mono text-muted">{d.score}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: d.score < 35 ? "var(--contradiction)" : d.score < 65 ? "var(--assumption)" : "var(--factor)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.score}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
