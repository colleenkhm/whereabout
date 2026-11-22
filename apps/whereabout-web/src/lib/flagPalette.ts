// Build-time flag color extraction. Stands in for Flutter's
// palette_generator: flags are flat blocks, so pixel-count clustering
// finds the same field colors.
import { PNG } from "pngjs";
import { hexToHsl, hexToRgb, rgbToHex, type Rgb } from "./color";

export const flagPngUrl = (iso: string) => `https://flagcdn.com/w160/${iso.toLowerCase()}.png`;

const dist = (a: Rgb, b: Rgb) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

// palette_generator's near-red-line filter (skin/brown tones).
function nearRedLine(hex: string): boolean {
  const { h, s } = hexToHsl(hex);
  return h >= 10 && h <= 37 && s <= 0.82;
}

// Anti-aliased stripe edges: a color on the segment between two
// larger ones (e.g. pink between US red and white).
function isBlend(c: Rgb, larger: Rgb[]): boolean {
  for (let i = 0; i < larger.length; i++) {
    for (let j = i + 1; j < larger.length; j++) {
      const a = larger[i], b = larger[j];
      const ab = { r: b.r - a.r, g: b.g - a.g, b: b.b - a.b };
      const len2 = ab.r ** 2 + ab.g ** 2 + ab.b ** 2;
      if (len2 === 0) continue;
      const t = ((c.r - a.r) * ab.r + (c.g - a.g) * ab.g + (c.b - a.b) * ab.b) / len2;
      if (t <= 0.1 || t >= 0.9) continue;
      const p = { r: a.r + ab.r * t, g: a.g + ab.g * t, b: a.b + ab.b * t };
      if (dist(c, p) < 0.06) return true;
    }
  }
  return false;
}

export async function extractFlagBaseColors(iso: string): Promise<string[] | null> {
  try {
    const res = await fetch(flagPngUrl(iso));
    if (!res.ok) return null;
    const png = PNG.sync.read(Buffer.from(await res.arrayBuffer()));

    // 5-bit-per-channel histogram, opaque pixels only.
    const buckets = new Map<number, { sum: Rgb; count: number }>();
    const { data } = png;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
      const b = buckets.get(key) ?? { sum: { r: 0, g: 0, b: 0 }, count: 0 };
      b.sum.r += data[i] / 255;
      b.sum.g += data[i + 1] / 255;
      b.sum.b += data[i + 2] / 255;
      b.count++;
      buckets.set(key, b);
    }

    // Merge neighbouring buckets into clusters, largest first.
    const clusters: { color: Rgb; count: number }[] = [];
    for (const b of [...buckets.values()].sort((x, y) => y.count - x.count)) {
      const color = { r: b.sum.r / b.count, g: b.sum.g / b.count, b: b.sum.b / b.count };
      const near = clusters.find((c) => dist(c.color, color) < 0.08);
      if (near) near.count += b.count;
      else clusters.push({ color, count: b.count });
    }

    const swatches = clusters
      .map((c) => ({ hex: rgbToHex(c.color), count: c.count }))
      .filter((s) => !nearRedLine(s.hex))
      .sort((a, b) => b.count - a.count);
    if (swatches.length === 0) return null;

    // Drop emblem detail, near-duplicates, and edge blends.
    const threshold = swatches[0].count * 0.08;
    const base: string[] = [];
    for (const s of swatches) {
      if (s.count < threshold) continue;
      const rgb = hexToRgb(s.hex);
      if (base.some((c) => dist(hexToRgb(c), rgb) < 0.12)) continue;
      if (isBlend(rgb, base.map(hexToRgb))) continue;
      base.push(s.hex);
    }
    return base.length ? base : null;
  } catch (e) {
    console.warn(`Flag palette extraction failed for ${iso}:`, e);
    return null;
  }
}
