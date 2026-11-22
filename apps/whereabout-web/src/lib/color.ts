// Port of contrast_color.dart and section_palette.dart.

export type Rgb = { r: number; g: number; b: number }; // 0-1
type Hsl = { h: number; s: number; l: number }; // h 0-360, s/l 0-1

export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};

export const rgbToHex = ({ r, g, b }: Rgb): string =>
  "#" +
  [r, g, b]
    .map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0"))
    .join("");

export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
};

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: r + m, g: g + m, b: b + m };
}

export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex));
const hslToHex = (hsl: Hsl) => rgbToHex(hslToRgb(hsl));

// WCAG 2.0 relative luminance.
function luminance(hex: string): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a) + 0.05;
  const lb = luminance(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

export const readableTextColor = (bg: string) =>
  contrast(bg, "#ffffff") >= contrast(bg, "#000000") ? "#ffffff" : "#000000";

// Steps lightness down until it reads on white (3:1).
export function accentReadableOnWhite(hex: string): string {
  if (contrast(hex, "#ffffff") >= 3) return hex;
  const hsl = hexToHsl(hex);
  let l = hsl.l;
  let candidate = hex;
  while (contrast(candidate, "#ffffff") < 3 && l > 0.15) {
    l -= 0.05;
    candidate = hslToHex({ ...hsl, l });
  }
  return candidate;
}

// --- Section palette ---

export interface SectionColors {
  tint: string;
  textColor: string;
  accentOnWhite: string;
}

export interface SectionPalette {
  visa: SectionColors;
  cities: SectionColors;
  map: SectionColors;
  borderCountries: SectionColors;
  times: SectionColors;
  advisory: SectionColors;
  language: SectionColors;
  norms: SectionColors;
  resources: SectionColors;
  header: SectionColors;
  stub: SectionColors;
}

export const paletteCycle = (p: SectionPalette): SectionColors[] => [
  p.visa,
  p.cities,
  p.map,
  p.borderCountries,
  p.times,
  p.advisory,
  p.language,
  p.norms,
  p.resources,
];

const ACHROMATIC = 0.08;

function colorsFor(raw: string, toneDown = true): SectionColors {
  const tint = toneDown ? toned(raw) : raw;
  return { tint, textColor: readableTextColor(tint), accentOnWhite: accentReadableOnWhite(raw) };
}

// Same hue, ~28% less saturation.
function toned(hex: string): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, s: Math.min(1, hsl.s * 0.72) });
}

// High saturation even when dark: dark + desaturated red reads brown.
function deepen(hex: string): string {
  const hsl = hexToHsl(hex);
  return hsl.s < ACHROMATIC ? hslToHex({ h: hsl.h, s: 0, l: 0.16 }) : hslToHex({ h: hsl.h, s: 0.65, l: 0.16 });
}

function midtone(hex: string): string {
  const hsl = hexToHsl(hex);
  return hsl.s < ACHROMATIC ? hslToHex({ h: hsl.h, s: 0, l: 0.32 }) : hslToHex({ h: hsl.h, s: 0.55, l: 0.32 });
}

// First chromatic color, so white/black-first flags still get a hue.
const headerSource = (colors: string[]) => colors.find((c) => hexToHsl(c).s >= ACHROMATIC) ?? colors[0];

// colors: most prominent first.
export function paletteFromFlagColors(colors: string[]): SectionPalette {
  const header = headerSource(colors);
  // Keep the masthead hue from also leading the section cycle.
  const source = colors.length > 1 && colors[0] === header ? [...colors.slice(1), colors[0]] : colors;
  const s = Array.from({ length: 9 }, (_, i) => colorsFor(source[i % source.length]));
  return {
    visa: s[0],
    cities: s[1],
    map: s[2],
    borderCountries: s[3],
    times: s[4],
    advisory: s[5],
    language: s[6],
    norms: s[7],
    resources: s[8],
    header: colorsFor(deepen(header), false),
    stub: colorsFor(midtone(header), false),
  };
}

export const fallbackPalette: SectionPalette = {
  visa: colorsFor("#d8edf8"),
  cities: colorsFor("#e8e0f5"),
  map: colorsFor("#d8ede0"),
  borderCountries: colorsFor("#e8e0f5"),
  times: colorsFor("#fdf3d0"),
  advisory: colorsFor("#d8ede0"),
  language: colorsFor("#fae0e4"),
  norms: colorsFor("#fdecd8"),
  resources: colorsFor("#d8edf8"),
  header: colorsFor(deepen("#d8edf8"), false),
  stub: colorsFor(midtone("#d8edf8"), false),
};

export function advisoryColor(level: number): string {
  return level === 1 ? "var(--ok)" : level === 2 ? "var(--butter-dark)" : level === 3 ? "var(--rose-dark)" : "var(--danger)";
}
