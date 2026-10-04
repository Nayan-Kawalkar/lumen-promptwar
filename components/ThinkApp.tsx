"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, List, Loader2, Network, Sparkle } from "lucide-react";
import { Logo, NeverDecides } from "./Brand";
import { DecisionInput } from "./DecisionInput";
import { ScanningOverlay } from "./ScanningOverlay";
import { Constellation } from "./Constellation";
import { NodePanel } from "./NodePanel";
import { VisibilityMeter } from "./VisibilityMeter";
import { LensDeck } from "./LensDeck";
import { PreMortem } from "./PreMortem";
import { ClarityReport } from "./ClarityReport";
import { api, dimensionScores, KIND_META, toExchanges, toMapNodes, visibility, type MapNode } from "@/lib/client";
import type { Analysis, Lenses, Premortem, Report } from "@/lib/schemas";
import { DEMO_CONTEXT, DEMO_DECISION } from "@/lib/demo";

type Stage = "describe" | "scanning" | "map" | "lenses" | "premortem" | "report";
const STEPS: { id: Stage; label: string }[] = [
  { id: "describe", label: "Describe" },
  { id: "map", label: "Illuminate" },
  { id: "lenses", label: "Lenses" },
  { id: "premortem", label: "Pre-mortem" },
  { id: "report", label: "Clarity" },
];

export function ThinkApp() {
  const params = useSearchParams();
  const startDemo = params.get("demo") === "1";

  const [stage, setStage] = useState<Stage>("describe");
  const [input, setInput] = useState(
    startDemo ? { decision: DEMO_DECISION, context: DEMO_CONTEXT, demo: true } : { decision: "", context: "", demo: false },
  );
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [listView, setListView] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [lenses, setLenses] = useState<Lenses | null>(null);
  const [lensNotes, setLensNotes] = useState<Record<string, string>>({});
  const [story, setStory] = useState("");
  const [pmPath, setPmPath] = useState(0);
  const [premortem, setPremortem] = useState<Premortem | null>(null);
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const notifyFallback = useCallback(() => {
    setToast("Gemini is busy right now, so Lumen is showing a cached response.");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const ctx = analysis ? { decision: input.decision, context: input.context, summary: analysis.summary } : null;

  /* ---- step 1 → 2 ---- */
  const analyze = async (v: typeof input) => {
    setInput(v);
    setAnalyzeError(null);
    setStage("scanning");
    const started = Date.now();
    try {
      const { data, fallback } = await api<Analysis>("/api/analyze", v);
      if (fallback) notifyFallback();
      // let the scan breathe a little even when the model is fast
      await new Promise((r) => setTimeout(r, Math.max(0, 2600 - (Date.now() - started))));
      setAnalysis(data);
      setNodes(toMapNodes(data));
      setLenses(null);
      setLensNotes({});
      setStory("");
      setPmPath(0);
      setPremortem(null);
      setReport(null);
      setSelected(null);
      setStage("map");
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "Something went wrong");
      setStage("describe");
    }
  };

  const discover = useCallback((ids: string[]) => {
    setNodes((ns) => (ids.some((id) => ns.find((n) => n.id === id && !n.discovered)) ? ns.map((n) => (ids.includes(n.id) ? { ...n, discovered: true } : n)) : ns));
  }, []);

  const update = useCallback((id: string, patch: Partial<MapNode>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const vis = analysis ? visibility(analysis, nodes) : 0;
  const startVis = useMemo(() => (analysis ? visibility(analysis, toMapNodes(analysis)) : 0), [analysis]);
  const dims = analysis ? dimensionScores(analysis, nodes) : [];
  const found = nodes.filter((n) => n.discovered).length;
  const litCount = nodes.filter((n) => n.lit).length;
  const selectedNode = nodes.find((n) => n.id === selected) ?? null;
  const nextNode = nodes.find((n) => !n.lit && n.id !== selected && n.discovered) ?? nodes.find((n) => !n.lit && n.id !== selected);

  /* ---- lenses ---- */
  useEffect(() => {
    if (stage !== "lenses" || lenses || !ctx) return;
    let cancelled = false;
    api<Lenses>("/api/lens", { ...ctx, options: analysis?.options ?? [], covered: nodes.map((n) => n.question) })
      .then(({ data, fallback }) => {
        if (cancelled) return;
        if (fallback) notifyFallback();
        setLenses(data);
      })
      .catch(() => !cancelled && setToast("Couldn't load the lenses. Try again in a moment."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, lenses]);

  /* ---- pre-mortem ---- */
  const runPremortem = async () => {
    if (!ctx) return;
    setPmLoading(true);
    setPmError(null);
    try {
      const { data, fallback } = await api<Premortem>("/api/premortem", { ...ctx, path: analysis?.options[pmPath] ?? "", story });
      if (fallback) notifyFallback();
      setPremortem(data);
    } catch (e) {
      setPmError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPmLoading(false);
    }
  };

  /* ---- report ---- */
  const buildReport = useCallback(async () => {
    if (!ctx || !analysis) return;
    setReport(null);
    setReportError(null);
    const explored = [
      ...nodes.filter((n) => n.thread.length).map((n) => ({ kind: n.kind, title: n.title, exchanges: toExchanges(n) })),
      ...(lenses?.lenses ?? [])
        .filter((l) => lensNotes[l.id]?.trim())
        .map((l) => ({
          kind: "lens",
          title: `${l.id} lens`,
          exchanges: [{ question: l.questions.join(" / ").slice(0, 600), answer: lensNotes[l.id].slice(0, 2000) }],
        })),
    ].slice(0, 30);
    try {
      const { data, fallback } = await api<Report>("/api/report", {
        ...ctx,
        options: analysis.options,
        explored,
        unexplored: nodes.filter((n) => !n.lit).map((n) => n.title),
        premortem: story.trim() ? `Imagining they chose "${analysis.options[pmPath] ?? "it"}": ${story.trim()}`.slice(0, 2500) : undefined,
      });
      if (fallback) notifyFallback();
      setReport(data);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Something went wrong");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, nodes, lenses, lensNotes, story]);

  const go = (s: Stage) => {
    setSelected(null);
    setStage(s);
    if (s === "report") buildReport();
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    setAnalysis(null);
    setNodes([]);
    setInput({ decision: "", context: "", demo: false });
    go("describe");
  };

  const stepIndex = STEPS.findIndex((s) => s.id === (stage === "scanning" ? "describe" : stage));
  const isMap = stage === "map";

  return (
    <div className={`relative flex flex-col ${isMap ? "h-dvh overflow-hidden" : "min-h-dvh"}`}>
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
        <div className="fog-blob left-[-10%] top-[-10%] h-[60vh] w-[60vw] bg-[#1d1840]/70" />
        <div className="fog-blob bottom-[-20%] right-[-10%] h-[60vh] w-[50vw] bg-[#2a1a2e]/60" style={{ animationDelay: "-12s" }} />
      </div>

      <header className="no-print relative z-50 flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          {analysis && stage !== "describe" && stage !== "scanning" && <VisibilityMeter value={vis} dimensions={dims} />}
        </div>
        <nav aria-label="Progress" className="hidden items-center gap-1 lg:flex">
          {STEPS.map((s, i) => {
            const reachable = s.id === "describe" || Boolean(analysis);
            const active = i === stepIndex;
            return (
              <button
                key={s.id}
                disabled={!reachable || stage === "scanning"}
                onClick={() => go(s.id)}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ${
                  active ? "bg-white/[0.07] text-text" : "text-muted enabled:hover:text-text disabled:opacity-40"
                }`}
              >
                <span className={`font-mono ${i <= stepIndex ? "text-light" : ""}`}>0{i + 1}</span>
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden sm:block">
          <NeverDecides compact />
        </div>
      </header>

      <main className={`relative z-10 flex flex-1 flex-col ${isMap ? "min-h-0" : "justify-center py-8"}`}>
        <AnimatePresence mode="wait">
          {stage === "describe" && (
            <motion.div key="describe" exit={{ opacity: 0 }}>
              <DecisionInput initial={input} onSubmit={analyze} error={analyzeError} />
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div key="scan" className="flex flex-1 items-center justify-center">
              <ScanningOverlay decision={input.decision} />
            </motion.div>
          )}

          {isMap && analysis && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative min-h-0 flex-1"
            >
              {listView ? (
                <ListView analysis={analysis} nodes={nodes} onSelect={(id) => { discover([id]); setSelected(id); }} />
              ) : (
                <Constellation
                  analysis={analysis}
                  nodes={nodes}
                  selectedId={selected}
                  onDiscover={discover}
                  onSelect={setSelected}
                />
              )}

              {/* guidance */}
              <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="glass rounded-full px-4 py-2 text-center text-xs text-text/80"
                >
                  {found < nodes.length ? (
                    <>
                      <Sparkle className="mr-1.5 inline size-3 text-light" />
                      Move your light through the dark · <span className="text-light">{found}</span>/{nodes.length} found
                    </>
                  ) : litCount < nodes.length ? (
                    <>
                      Everything is found. Click a thought to examine it · <span className="text-light">{litCount}</span>/
                      {nodes.length} illuminated
                    </>
                  ) : (
                    <>Every corner is lit. Ready to look through other eyes.</>
                  )}
                </motion.div>
              </div>

              {/* legend */}
              <div className="pointer-events-none absolute bottom-3 left-3 z-30 hidden flex-col gap-1.5 md:flex">
                {(["factor", "assumption", "blindspot", "contradiction"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2 text-[11px] text-muted">
                    <span className="size-2 rounded-full" style={{ background: KIND_META[k].color, boxShadow: `0 0 10px ${KIND_META[k].color}` }} />
                    <span className="text-text/80">{KIND_META[k].label}</span>
                    <span className="hidden xl:inline">— {KIND_META[k].hint}</span>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div className={`absolute bottom-3 right-3 z-30 flex items-center gap-2 ${selectedNode ? "max-md:hidden md:right-[440px]" : ""}`}>
                <button
                  onClick={() => setListView((v) => !v)}
                  className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs text-text/80 hover:text-text"
                  aria-pressed={listView}
                >
                  {listView ? <Network className="size-3.5" /> : <List className="size-3.5" />}
                  {listView ? "Map view" : "List view"}
                </button>
                {found < nodes.length && (
                  <button
                    onClick={() => discover(nodes.map((n) => n.id))}
                    className="glass hidden rounded-full px-3.5 py-2.5 text-xs text-text/80 hover:text-text sm:inline-flex"
                  >
                    Reveal all
                  </button>
                )}
                <button
                  onClick={() => go("lenses")}
                  className="inline-flex items-center gap-2 rounded-full bg-light px-4 py-2.5 text-xs font-medium text-ink shadow-[0_0_40px_-10px_rgba(255,214,140,0.9)]"
                >
                  Next: Lenses <ArrowRight className="size-3.5" />
                </button>
              </div>

              <AnimatePresence>
                {selectedNode && (
                  <NodePanel
                    key={selectedNode.id}
                    node={selectedNode}
                    options={analysis.options}
                    decision={input.decision}
                    summary={analysis.summary}
                    onUpdate={update}
                    onClose={() => setSelected(null)}
                    hasNext={Boolean(nextNode)}
                    onNext={() => {
                      if (!nextNode) return;
                      discover([nextNode.id]);
                      setSelected(nextNode.id);
                    }}
                    onFallback={notifyFallback}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {stage === "lenses" && (
            <motion.div key="lenses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LensDeck lenses={lenses} notes={lensNotes} onNote={(id, v) => setLensNotes((n) => ({ ...n, [id]: v }))} />
              <StageNav onBack={() => go("map")} onNext={() => go("premortem")} nextLabel="Next: Pre-mortem" />
            </motion.div>
          )}

          {stage === "premortem" && (
            <motion.div key="pm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PreMortem
                options={analysis?.options ?? []}
                path={pmPath}
                onPath={(i) => {
                  setPmPath(i);
                  setPremortem(null);
                }}
                story={story}
                result={premortem}
                onStory={setStory}
                onRun={runPremortem}
                loading={pmLoading}
                error={pmError}
              />
              <StageNav onBack={() => go("lenses")} onNext={() => go("report")} nextLabel="See my Clarity Report" />
            </motion.div>
          )}

          {stage === "report" && analysis && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {report ? (
                <ClarityReport report={report} decision={input.decision} visibility={vis} startVisibility={startVis} onRestart={restart} />
              ) : reportError ? (
                <div className="text-center">
                  <p className="text-contradiction">{reportError}</p>
                  <button onClick={buildReport} className="mt-4 rounded-full border border-line px-5 py-2 text-sm">
                    Try again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-24 text-center" role="status">
                  <Loader2 className="size-6 animate-spin text-light" />
                  <p className="font-serif text-2xl italic">Gathering what you&apos;ve seen…</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className="glass fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full px-5 py-2.5 text-xs text-text/90"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StageNav({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="no-print mx-auto mt-10 flex max-w-6xl items-center justify-between px-5 pb-10">
      <button onClick={onBack} className="rounded-full px-4 py-2.5 text-sm text-muted hover:text-text">
        ← Back
      </button>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-full bg-light px-6 py-3 text-sm font-medium text-ink shadow-[0_0_50px_-10px_rgba(255,214,140,0.9)]"
      >
        {nextLabel} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function ListView({ analysis, nodes, onSelect }: { analysis: Analysis; nodes: MapNode[]; onSelect: (id: string) => void }) {
  return (
    <div className="scroll-thin h-full overflow-y-auto px-4 pb-24 pt-16">
      <div className="mx-auto max-w-3xl">
        <p className="label mb-2">Your decision</p>
        <h2 className="font-serif text-3xl">{analysis.title}</h2>
        {analysis.options.length > 1 && <p className="mt-1 text-xs uppercase tracking-wider text-muted">{analysis.options.join(" ⟷ ")}</p>}
        <p className="mt-2 text-sm text-muted">{analysis.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.factors.map((f) => (
            <span key={f.label} className="rounded-full border border-factor/30 bg-factor/10 px-3 py-1 text-xs text-factor">
              {f.label}
            </span>
          ))}
        </div>
        {(["contradiction", "assumption", "blindspot"] as const).map((k) => (
          <section key={k} className="mt-8">
            <p className="label mb-3" style={{ color: KIND_META[k].color }}>
              {KIND_META[k].label}s
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {nodes
                .filter((n) => n.kind === k)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onSelect(n.id)}
                    className="glass rounded-2xl p-4 text-left transition hover:border-white/20"
                  >
                    <p className="flex items-center gap-2 font-medium" style={{ color: n.lit ? "var(--lit)" : undefined }}>
                      {n.lit && "✓ "}
                      {n.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">{n.insight}</p>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
