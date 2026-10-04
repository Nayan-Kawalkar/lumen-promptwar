"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Analysis } from "@/lib/schemas";
import { KIND_META, type MapNode } from "@/lib/client";

const LIGHT_R = 150;

type Pt = { x: number; y: number };

function interleave(nodes: MapNode[]) {
  const groups = ["assumption", "blindspot", "contradiction"].map((k) => nodes.filter((n) => n.kind === k));
  const out: MapNode[] = [];
  for (let i = 0; out.length < nodes.length; i++) groups.forEach((g) => g[i] && out.push(g[i]));
  return out;
}

function layout(w: number, h: number, factorCount: number, nodes: MapNode[]) {
  const cx = w / 2;
  const cy = h / 2;
  const narrow = w < 640;
  const rx1 = narrow ? w * 0.3 : Math.min(Math.max(w * 0.2, 200), 260);
  const ry1 = narrow ? h * 0.15 : Math.min(Math.max(h * 0.2, 100), 150);
  const rx2 = narrow ? w * 0.36 : Math.min(w * 0.38, 560);
  const ry2 = narrow ? h * 0.38 : Math.min(h * 0.4, 330);

  const factors: Pt[] = Array.from({ length: factorCount }, (_, i) => {
    const a = -Math.PI / 2 + Math.PI / factorCount + (i / factorCount) * Math.PI * 2;
    return { x: cx + Math.cos(a) * rx1, y: cy + Math.sin(a) * ry1 };
  });

  const ordered = interleave(nodes);
  const pos: Record<string, Pt> = {};
  ordered.forEach((n, i) => {
    const a = -Math.PI / 2 + (i / ordered.length) * Math.PI * 2;
    const k = i % 2 ? 0.84 : 1;
    const pad = narrow ? 84 : 104; // keep labels inside the frame
    pos[n.id] = {
      x: Math.min(w - pad, Math.max(pad, cx + Math.cos(a) * rx2 * k)),
      y: Math.min(h - 40, Math.max(56, cy + Math.sin(a) * ry2 * k)),
    };
  });
  return { center: { x: cx, y: cy }, factors, pos };
}

// deterministic starfield
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 73.13) % 100,
  y: (i * 41.77 + (i % 7) * 9.1) % 100,
  s: 0.5 + ((i * 13) % 10) / 10,
  o: 0.08 + ((i * 29) % 10) / 40,
}));

export function Constellation({
  analysis,
  nodes,
  selectedId,
  onDiscover,
  onSelect,
}: {
  analysis: Analysis;
  nodes: MapNode[];
  selectedId: string | null;
  onDiscover: (ids: string[]) => void;
  onSelect: (id: string) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const target = useRef<Pt | null>(null);
  const light = useRef<Pt>({ x: 0, y: 0 });
  const nodesRef = useRef(nodes);
  const onDiscoverRef = useRef(onDiscover);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = useMemo(() => layout(size.w, size.h, analysis.factors.length, nodes), [size, analysis.factors.length, nodes]);
  const posRef = useRef(L.pos);
  useLayoutEffect(() => {
    nodesRef.current = nodes;
    onDiscoverRef.current = onDiscover;
    posRef.current = L.pos;
  });

  // smooth flashlight + proximity discovery
  useEffect(() => {
    const el = wrap.current;
    if (!el || !size.w) return;
    light.current = { x: size.w / 2, y: size.h / 2 };
    let raf = 0;
    const tick = (t: number) => {
      const goal = target.current ?? {
        // idle drift until the user takes over
        x: size.w / 2 + Math.cos(t / 1800) * size.w * 0.3,
        y: size.h / 2 + Math.sin(t / 1400) * size.h * 0.3,
      };
      const k = target.current ? 0.2 : 0.02;
      light.current.x += (goal.x - light.current.x) * k;
      light.current.y += (goal.y - light.current.y) * k;
      el.style.setProperty("--lx", `${light.current.x}px`);
      el.style.setProperty("--ly", `${light.current.y}px`);

      if (target.current) {
        const found = nodesRef.current
          .filter((n) => !n.discovered)
          .filter((n) => {
            const p = posRef.current[n.id];
            return p && Math.hypot(p.x - light.current.x, p.y - light.current.y) < LIGHT_R * 0.75;
          })
          .map((n) => n.id);
        if (found.length) onDiscoverRef.current(found);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  const point = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const fogMask = `radial-gradient(circle ${LIGHT_R}px at var(--lx) var(--ly), transparent 0%, transparent 35%, black 100%), radial-gradient(ellipse ${L.center.x ? Math.max(180, size.w * 0.2) : 200}px ${Math.max(150, size.h * 0.24)}px at 50% 50%, transparent 40%, black 100%)`;

  return (
    <div
      ref={wrap}
      onPointerMove={point}
      onPointerDown={point}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{ ["--lx" as string]: "50%", ["--ly" as string]: "50%" }}
    >
      {/* stars */}
      <div aria-hidden className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s * 2, height: s.s * 2, opacity: s.o }}
          />
        ))}
      </div>

      {/* threads */}
      {size.w > 0 && (
        <svg aria-hidden className="absolute inset-0 h-full w-full">
          {L.factors.map((p, i) => (
            <line key={i} x1={L.center.x} y1={L.center.y} x2={p.x} y2={p.y} stroke="var(--factor)" strokeOpacity={0.35} />
          ))}
          {nodes.map((n) => {
            const p = L.pos[n.id];
            if (!p || !n.discovered) return null;
            const from = n.factor >= 0 && L.factors[n.factor] ? L.factors[n.factor] : L.center;
            const color = n.lit ? "var(--lit)" : KIND_META[n.kind].color;
            return (
              <motion.line
                key={n.id}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9 }}
                x1={from.x}
                y1={from.y}
                x2={p.x}
                y2={p.y}
                stroke={color}
                strokeOpacity={n.lit ? 0.6 : 0.3}
                strokeDasharray={n.kind === "contradiction" ? "4 6" : undefined}
                className={n.kind === "contradiction" && !n.lit ? "pulse-line" : undefined}
                strokeWidth={n.kind === "contradiction" ? 1.5 : 1}
              />
            );
          })}
        </svg>
      )}

      {/* fog of the unexamined */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: "rgba(3,4,9,0.84)",
          maskImage: fogMask,
          WebkitMaskImage: fogMask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <div className="fog-blob left-[5%] top-[10%] h-[45%] w-[40%] bg-[#2a2350]" />
        <div className="fog-blob bottom-[5%] right-[5%] h-[50%] w-[45%] bg-[#18284a]" style={{ animationDelay: "-8s" }} />
        <div className="fog-blob bottom-[20%] left-[30%] h-[35%] w-[35%] bg-[#301c3c]" style={{ animationDelay: "-15s" }} />
      </div>

      {/* center: the decision */}
      {size.w > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute z-10 w-[min(260px,46vw)] -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ left: L.center.x, top: L.center.y }}
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-light/20 blur-3xl" />
          <p className="label mb-1 text-light/80">Your decision</p>
          <p className="font-serif text-lg leading-snug text-text md:text-2xl">{analysis.title}</p>
          {analysis.options.length > 1 && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted md:text-[11px]">
              {analysis.options.map((o, i) => (
                <span key={o}>
                  {i > 0 && <span className="mx-1.5 text-light/60">⟷</span>}
                  {o}
                </span>
              ))}
            </p>
          )}
        </motion.div>
      )}

      {/* factors: what you already see */}
      {size.w > 0 &&
        analysis.factors.map((f, i) => (
          <motion.div
            key={f.label + i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: L.factors[i].x, top: L.factors[i].y }}
          >
            <div
              title={f.quote ? `You said: “${f.quote}”` : undefined}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-factor/30 bg-factor/10 px-2.5 py-1 text-[11px] text-factor shadow-[0_0_24px_-6px_var(--factor)] md:text-xs"
            >
              <span className="size-1.5 rounded-full bg-factor" />
              {f.label}
            </div>
          </motion.div>
        ))}

      {/* hidden thoughts */}
      {size.w > 0 &&
        nodes.map((n, i) => {
          const p = L.pos[n.id];
          if (!p) return null;
          const meta = KIND_META[n.kind];
          const color = n.lit ? "var(--lit)" : meta.color;
          const selected = selectedId === n.id;
          if (!n.discovered) {
            return (
              <button
                key={n.id}
                aria-label="Hidden thought. Press to reveal."
                onFocus={() => onDiscover([n.id])}
                onClick={() => onDiscover([n.id])}
                className="absolute z-20 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline focus-visible:outline-light/60"
                style={{ left: p.x, top: p.y }}
              >
                <span
                  className="size-1.5 animate-pulse rounded-full bg-white/40"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              </button>
            );
          }
          return (
            <motion.button
              key={n.id}
              layout={false}
              initial={{ opacity: 0, scale: 0.3, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
              onClick={() => onSelect(n.id)}
              aria-label={`${meta.label}: ${n.title}${n.lit ? " (illuminated)" : ""}`}
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
              style={{ left: p.x, top: p.y }}
            >
              <span
                className="flex max-w-[150px] items-center gap-2 rounded-2xl border px-2.5 py-1.5 text-left text-[11px] leading-tight backdrop-blur-md transition group-hover:scale-105 group-focus-visible:scale-105 md:max-w-[190px] md:text-[13px]"
                style={{
                  borderColor: `color-mix(in oklab, ${color} ${selected ? 90 : 40}%, transparent)`,
                  background: `color-mix(in oklab, ${color} ${n.lit ? 22 : 10}%, rgba(8,9,18,0.7))`,
                  color: n.lit ? "var(--lit)" : "var(--text)",
                  boxShadow: `0 0 ${n.lit ? 40 : selected ? 30 : 18}px -6px ${color}`,
                }}
              >
                <span className="relative grid size-4 shrink-0 place-items-center">
                  {!n.lit && (
                    <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: color }} />
                  )}
                  {n.lit ? (
                    <Check className="size-3.5" style={{ color }} />
                  ) : (
                    <span className="size-2 rounded-full" style={{ background: color }} />
                  )}
                </span>
                <span>{n.title}</span>
              </span>
            </motion.button>
          );
        })}

      {/* the light itself */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 mix-blend-screen"
        style={{
          background: `radial-gradient(circle ${LIGHT_R * 1.3}px at var(--lx) var(--ly), rgba(255,220,150,0.14), rgba(255,220,150,0.03) 50%, transparent 70%)`,
        }}
      />
    </div>
  );
}
