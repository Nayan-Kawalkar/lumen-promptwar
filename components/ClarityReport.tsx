"use client";

import { motion } from "motion/react";
import { Copy, Printer, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Report } from "@/lib/schemas";
import { CertaintyShift, describeShift, type Stance } from "./CheckIn";

function Section({ title, color, children, delay }: { title: string; color: string; children: React.ReactNode; delay: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="print-card glass rounded-3xl p-5"
    >
      <p className="label mb-3" style={{ color }}>
        {title}
      </p>
      {children}
    </motion.section>
  );
}

const Bullets = ({ items, color }: { items: string[]; color: string }) => (
  <ul className="space-y-2 text-[15px] text-text/90">
    {items.map((t, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
        {t}
      </li>
    ))}
  </ul>
);

export function ClarityReport({
  report,
  decision,
  options,
  stance,
  onUpdateStance,
  visibility,
  startVisibility,
  onRestart,
}: {
  report: Report;
  decision: string;
  options: string[];
  stance: { before?: Stance; after?: Stance };
  onUpdateStance: () => void;
  visibility: number;
  startVisibility: number;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { before, after } = stance;

  const asText = () =>
    [
      `LUMEN · CLARITY REPORT`,
      `Decision: ${decision}`,
      `Visibility: ${startVisibility}% → ${visibility}%`,
      ...(before && after ? [`Certainty: ${before.sure}% → ${after.sure}%`, describeShift(options, before, after)] : []),
      ``,
      report.headline,
      ``,
      `What you value:`,
      ...report.valued.map((v) => `• ${v}`),
      ``,
      `What you examined:`,
      ...report.examined.map((e) => `• ${e.belief} — ${e.finding}`),
      ...(report.tensions.length ? [``, `Tensions you're holding:`, ...report.tensions.map((t) => `• ${t}`)] : []),
      ``,
      `Still open:`,
      ...report.open_questions.map((q) => `• ${q}`),
      ``,
      `Worth finding out:`,
      ...report.info_to_gather.map((q) => `• ${q}`),
      ``,
      report.closing,
    ].join("\n");

  return (
    <div className="mx-auto w-full max-w-4xl px-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <p className="label mb-3">Step 5 · Clarity Report</p>
        <p className="mx-auto max-w-xl text-sm text-muted">{decision}</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-3xl leading-tight md:text-5xl">{report.headline}</h2>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-line px-4 py-2 font-mono text-sm">
          <span className="text-muted">Visibility</span>
          <span className="text-muted">{startVisibility}%</span>
          <span className="text-muted">→</span>
          <span className="text-light">{visibility}%</span>
        </div>
      </motion.div>

      {before && after && (
        <CertaintyShift
          options={options}
          before={before}
          after={after}
          startVisibility={startVisibility}
          visibility={visibility}
          onUpdate={onUpdateStance}
        />
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Section title="What you seem to value" color="var(--factor)" delay={0.1}>
          <Bullets items={report.valued} color="var(--factor)" />
        </Section>
        <Section title="Tensions you're holding" color="var(--contradiction)" delay={0.2}>
          {report.tensions.length ? (
            <Bullets items={report.tensions} color="var(--contradiction)" />
          ) : (
            <p className="text-sm text-muted">No strong tensions surfaced.</p>
          )}
        </Section>
        {report.examined.length > 0 && (
          <Section title="What you examined" color="var(--assumption)" delay={0.3}>
            <ul className="space-y-3">
              {report.examined.map((e, i) => (
                <li key={i}>
                  <p className="text-[15px] font-medium text-assumption">{e.belief}</p>
                  <p className="text-sm text-text/80">{e.finding}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <Section title="Still in the dark" color="var(--blindspot)" delay={0.4}>
          <Bullets items={report.open_questions} color="var(--blindspot)" />
        </Section>
        <Section title="Worth finding out before you decide" color="var(--light)" delay={0.5}>
          <Bullets items={report.info_to_gather} color="var(--light)" />
        </Section>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="print-card relative mt-8 overflow-hidden rounded-3xl border border-light/25 p-8 text-center"
      >
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,214,140,0.16),transparent_70%)]" />
        <p className="font-serif text-2xl italic leading-snug md:text-3xl">{report.closing}</p>
        <p className="label mt-4 text-light/80">The decision is yours.</p>
      </motion.div>

      <div className="no-print mt-8 flex flex-wrap justify-center gap-3 pb-10">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm hover:border-white/25">
          <Printer className="size-4" /> Save as PDF
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(asText());
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm hover:border-white/25"
        >
          <Copy className="size-4" /> {copied ? "Copied" : "Copy as text"}
        </button>
        <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-full bg-light px-5 py-2.5 text-sm font-medium text-ink">
          <RotateCcw className="size-4" /> Think through another decision
        </button>
      </div>
    </div>
  );
}
