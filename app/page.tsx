"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { LightGlow, useFlashlight } from "@/components/Flashlight";
import { Logo, NeverDecides } from "@/components/Brand";

const HIDDEN = [
  { t: "who will actually mentor you?", x: "8%", y: "18%", r: -6 },
  { t: "exam month", x: "76%", y: "14%", r: 4 },
  { t: "opportunity cost", x: "82%", y: "62%", r: -3 },
  { t: "is the money really the reason?", x: "5%", y: "70%", r: 3 },
  { t: "your energy in week 12", x: "60%", y: "86%", r: -2 },
  { t: "who else does this affect?", x: "22%", y: "88%", r: 2 },
  { t: "can you undo it?", x: "70%", y: "36%", r: 6 },
  { t: "what if your friends just got lucky?", x: "14%", y: "44%", r: -4 },
];

const STEPS = [
  { n: "01", t: "Describe", d: "Say what you're deciding and why — type it or just talk." },
  { n: "02", t: "Illuminate", d: "Sweep the dark. Find the assumptions, blind spots and contradictions hiding there." },
  { n: "03", t: "See clearly", d: "Test your reasoning through new lenses, then leave with a Clarity Report — not a verdict." },
];

export default function Home() {
  useFlashlight();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <LightGlow />

      {/* hidden thoughts, only visible under the light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
        {HIDDEN.map((h) => (
          <span
            key={h.t}
            className="reveal-ghost absolute font-serif text-2xl italic md:text-3xl"
            style={{ left: h.x, top: h.y, transform: `rotate(${h.r}deg)` }}
          >
            {h.t}
          </span>
        ))}
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <NeverDecides />
      </header>

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pt-[9vh] text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="label mb-6"
        >
          An AI flashlight for your reasoning
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="font-serif text-[clamp(3rem,10vw,8.5rem)] leading-[0.92] tracking-tight"
        >
          <span className="text-text/90">Every decision has a</span>
          <br />
          <span className="reveal italic">blind spot.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-8 max-w-xl text-base text-muted md:text-lg"
        >
          Tell Lumen what you&apos;re deciding. It maps what you can already see — then hands you a light to find what
          you can&apos;t. It asks. You decide.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="/think"
            className="group inline-flex items-center gap-2 rounded-full bg-light px-7 py-3.5 font-medium text-ink shadow-[0_0_60px_-10px_rgba(255,214,140,0.8)] transition hover:shadow-[0_0_80px_-6px_rgba(255,214,140,1)]"
          >
            Light up a decision
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/think?demo=1"
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm text-text/80 transition hover:border-white/25 hover:text-text"
          >
            <Sparkles className="size-4 text-assumption" />
            Try the internship example
          </Link>
        </motion.div>

        <p className="mt-6 text-xs text-muted/70 sm:hidden">Tap anywhere to move the light.</p>
        <p className="mt-6 hidden text-xs text-muted/70 sm:block">Move your cursor. Some thoughts only appear in the light.</p>
      </section>

      <section className="relative z-10 mx-auto mt-[10vh] grid max-w-5xl gap-4 px-5 pb-16 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 + i * 0.12 }}
            className="glass rounded-2xl p-5 text-left"
          >
            <div className="label mb-3 text-light/70">{s.n}</div>
            <div className="font-serif text-2xl">{s.t}</div>
            <p className="mt-1.5 text-sm text-muted">{s.d}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
