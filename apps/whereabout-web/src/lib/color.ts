// Port of contrast_color.dart and section_palette.dart.

import type { CSSProperties } from "react";

// Runtime colors for a CSS module, as custom properties. The only inline style allowed.
export const cssVars = (vars: Record<`--${string}`, string | undefined>) => vars as CSSProperties;

// A SectionColors as --tint / --text / --accent.
export const sectionVars = (c: SectionColors) =>
  cssVars({ "--tint": c.tint, "--text": c.textColor, "--accent": c.accentOnWhite });

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

// --- Palettes ---

export interface SectionColors {
  tint: string;
  textColor: string;
  accentOnWhite: string;
}

export interface TicketColors {
  body: SectionColors;
  stub: SectionColors;
}

// Masthead plus one two-tone ticket per flag color.
export interface SectionPalette {
  header: SectionColors;
  // Deeper shade of the masthead color (same formula as ticket stubs), its accent.
  headerAccent: string;
  // Masthead: the next flag color after the page's; else headerAccent.
  nav: string;
  // Page behind the cards: color 1, full strength.
  page: SectionColors;
  // Bottom of the page gradient: same hue as page, a little deeper.
  pageDeep: string;
  tickets: TicketColors[];
}

const ACHROMATIC = 0.08;

function colorsFor(tint: string): SectionColors {
  return { tint, textColor: readableTextColor(tint), accentOnWhite: accentReadableOnWhite(tint) };
}

// High saturation even when dark: dark + desaturated red reads brown.
function deepen(hex: string): string {
  const hsl = hexToHsl(hex);
  return hsl.s < ACHROMATIC ? hslToHex({ h: hsl.h, s: 0, l: 0.16 }) : hslToHex({ h: hsl.h, s: 0.65, l: 0.16 });
}

// Stub accent: same hue, darker, saturation held so it doesn't go
// muddy. Light colors (yellows, golds) go paler instead of olive.
// White pairs with ink; black shifts toward gray.
function stubShade(hex: string): string {
  const hsl = hexToHsl(hex);
  if (hsl.s < ACHROMATIC) return hsl.l > 0.5 ? INK : hslToHex({ h: 0, s: 0, l: hsl.l + 0.18 });
  if (luminance(hex) > LIGHT) return paler(hex, 0.65);
  return hslToHex({ h: hsl.h, s: Math.max(hsl.s, 0.5), l: hsl.l * 0.7 });
}

// Matches --ink.
const INK = "#1a1520";

// WCAG luminance above which a color counts as light.
const LIGHT = 0.55;

// Lightness moved t of the way to white, hue and saturation kept.
function paler(hex: string, t: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: hsl.l + (1 - hsl.l) * t });
}

// Light colors soften on the body too; the stub stays paler still.
const ticketFor = (hex: string): TicketColors => ({
  body: colorsFor(hexToHsl(hex).s >= ACHROMATIC && luminance(hex) > LIGHT ? paler(hex, 0.35) : hex),
  stub: colorsFor(stubShade(hex)),
});

// White masthead: the stamp gets an ink outline.
export const isWhitish = (hex: string) => {
  const hsl = hexToHsl(hex);
  return hsl.s < ACHROMATIC && hsl.l > 0.85;
};

// First chromatic color, so white/black-first flags still get a hue.
const headerSource = (colors: string[]) => colors.find((c) => hexToHsl(c).s >= ACHROMATIC) ?? colors[0];

// Page bottom: same hue, a touch deeper, saturation held so reds stay red.
const pageDeepHex = (hex: string) => {
  const hsl = hexToHsl(hex);
  return hsl.s < ACHROMATIC
    ? hslToHex({ ...hsl, l: hsl.l * 0.92 })
    : hslToHex({ h: hsl.h, s: Math.max(hsl.s, 0.5), l: hsl.l * 0.9 });
};

// colors: most prominent first. Page = color 1; cards use the other flag colors.
// Only one other color: color 1 is its accent. Single-color flag: white cards.
export function paletteFromFlagColors(colors: string[]): SectionPalette {
  const header = headerSource(colors);
  const others = colors.filter((c) => c !== header);
  const headerAccent = stubShade(header);
  const tickets =
    others.length > 1
      ? others.map(ticketFor)
      : others.length === 1
        ? [{ body: ticketFor(others[0]).body, stub: colorsFor(header) }]
        : [{ body: colorsFor("#ffffff"), stub: colorsFor(header) }];
  return {
    header: colorsFor(header),
    headerAccent,
    nav: others[0] ?? headerAccent,
    page: colorsFor(header),
    pageDeep: pageDeepHex(header),
    tickets,
  };
}

// No flag colors: a fixed vintage-ticket set.
const fallbackHeader = deepen("#d8edf8");
export const fallbackPalette: SectionPalette = {
  header: colorsFor(fallbackHeader),
  headerAccent: stubShade(fallbackHeader),
  nav: stubShade(fallbackHeader),
  page: colorsFor(fallbackHeader),
  pageDeep: pageDeepHex(fallbackHeader),
  tickets: ["#e4704f", "#e9b949", "#5fa8a0", "#f2a477", "#8fa4d8", "#9dbb86", "#e39aae", "#b49bd6", "#d9bc8c"].map(ticketFor),
};

// Postcard grounds (#96): flag colors that carry white text; else a deep shade of the first hue.
export function postcardColors(colors: string[]): string[] {
  const usable = colors.filter((c) => hexToHsl(c).s >= ACHROMATIC && readableTextColor(c) === "#ffffff");
  if (usable.length) return usable;
  const first = headerSource(colors);
  return [first ? deepen(first) : INK];
}

export function advisoryColor(level: number): string {
  return level === 1 ? "var(--ok)" : level === 2 ? "var(--butter-dark)" : level === 3 ? "var(--rose-dark)" : "var(--danger)";
}
