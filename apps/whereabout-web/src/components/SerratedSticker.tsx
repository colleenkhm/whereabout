"use client";

import { useLayoutEffect, useRef, useState } from "react";

const SPIKE = 6; // depth
const PITCH = 12; // target spike width

// Box with a serrated edge: a whole number of spikes per side, measured so corners stay clean.
export default function SerratedSticker({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<string | undefined>();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setClip(serrated(el.offsetWidth, el.offsetHeight));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ clipPath: clip }}>
      {children}
    </div>
  );
}

// Polygon around the inner rect (inset SPIKE), spikes pointing out on every side.
function serrated(w: number, h: number): string {
  const pts: [number, number][] = [];
  const side = (x0: number, y0: number, x1: number, y1: number, ox: number, oy: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / PITCH));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const tm = (i + 0.5) / n;
      pts.push([x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0]);
      pts.push([x0 + (x1 - x0) * tm + ox * SPIKE, y0 + (y1 - y0) * tm + oy * SPIKE]);
    }
  };
  const s = SPIKE;
  side(s, s, w - s, s, 0, -1);
  side(w - s, s, w - s, h - s, 1, 0);
  side(w - s, h - s, s, h - s, 0, 1);
  side(s, h - s, s, s, -1, 0);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(", ")})`;
}
