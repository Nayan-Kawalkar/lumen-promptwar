"use client";

import { useEffect } from "react";

/**
 * Tracks the pointer and writes --mx / --my (viewport px) on <html>.
 * When idle or on touch devices the light wanders on its own so the effect is never dead.
 */
export function useFlashlight() {
  useEffect(() => {
    const root = document.documentElement;
    let x = window.innerWidth * 0.55;
    let y = window.innerHeight * 0.45;
    let tx = x;
    let ty = y;
    let lastMove = 0;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      lastMove = performance.now();
    };

    const tick = (t: number) => {
      if (t - lastMove > 2500 && !reduce) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        tx = w * (0.5 + 0.32 * Math.sin(t / 2600));
        ty = h * (0.48 + 0.2 * Math.sin(t / 1900 + 1.3));
      }
      const k = t - lastMove > 2500 ? 0.03 : 0.22;
      x += (tx - x) * k;
      y += (ty - y) * k;
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}

export function LightGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(circle 340px at var(--mx, 50%) var(--my, 50%), rgba(255, 214, 140, 0.13), rgba(255, 214, 140, 0.04) 45%, transparent 70%)",
      }}
    />
  );
}
