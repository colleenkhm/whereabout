// Faint fleck/fiber paper texture as a tiled SVG. Fixed seed.
const TILE = 320;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTile(): string {
  const rng = mulberry32(7);
  const parts: string[] = [];
  const flecks = Math.round((TILE * TILE) / 700);
  for (let i = 0; i < flecks; i++) {
    const r = 0.4 + rng() * 0.8;
    parts.push(`<circle cx="${(rng() * TILE).toFixed(1)}" cy="${(rng() * TILE).toFixed(1)}" r="${r.toFixed(2)}" fill-opacity=".035"/>`);
  }
  const fibers = Math.round((TILE * TILE) / 9000);
  for (let i = 0; i < fibers; i++) {
    const x = rng() * TILE;
    const y = rng() * TILE;
    const a = rng() * Math.PI * 2;
    const len = 6 + rng() * 10;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * len).toFixed(1)}" y2="${(y + Math.sin(a) * len).toFixed(1)}" stroke="#1a1520" stroke-opacity=".02"/>`,
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" fill="#1a1520">${parts.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const tile = buildTile();

export default function PaperTexture({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: `${tile} var(--page)` }}>{children}</div>
  );
}
