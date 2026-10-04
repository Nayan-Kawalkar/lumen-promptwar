"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LINES = [
  "Reading what you said…",
  "Separating your reasons from your details…",
  "Listening for what you didn't say…",
  "Looking for quiet assumptions…",
  "Checking where your reasons pull against each other…",
  "Placing your thoughts in the dark…",
];

export function ScanningOverlay({ decision }: { decision: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(v + 1, LINES.length - 1)), 1700);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center px-5 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative size-64 md:size-80">
        {[1, 0.72, 0.44].map((s) => (
          <div
            key={s}
            className="absolute rounded-full border border-white/[0.07]"
            style={{ inset: `${(1 - s) * 50}%` }}
          />
        ))}
        <div
          className="sweep absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,214,140,0.35) 50deg, transparent 60deg)",
          }}
        />
        {Array.from({ length: 9 }).map((_, k) => {
          const a = (k / 9) * Math.PI * 2 + 0.4;
          const r = 30 + ((k * 37) % 18);
          return (
            <motion.span
              key={k}
              className="absolute size-1.5 rounded-full"
              style={{
                left: `${50 + Math.cos(a) * r}%`,
                top: `${50 + Math.sin(a) * r}%`,
                background: ["var(--assumption)", "var(--blindspot)", "var(--contradiction)"][k % 3],
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.6], scale: [0, 1.6, 1] }}
              transition={{ delay: 0.8 + k * 0.55, duration: 0.8 }}
            />
          );
        })}
        <div className="absolute inset-0 grid place-items-center">
          <div className="size-3 rounded-full bg-light shadow-[0_0_40px_10px_rgba(255,214,140,0.6)]" />
        </div>
      </div>
      <p className="mt-10 max-w-md font-serif text-2xl italic text-text/90">&ldquo;{decision}&rdquo;</p>
      <div className="mt-4 h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="label"
          >
            {LINES[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
