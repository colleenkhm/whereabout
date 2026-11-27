// Profile themes (#96): a deep main color and a muted accent. Card, outline and light text are shared.
export const THEMES = {
  plum: { label: "Plum", main: "#3d2352", accent: "#c3b5e8" },
  aubergine: { label: "Aubergine", main: "#552244", accent: "#e5b3c0" },
  rust: { label: "Rust", main: "#6e2f17", accent: "#e8b596" },
  ochre: { label: "Ochre", main: "#54430f", accent: "#d9c49a" },
  forest: { label: "Forest", main: "#1f4d3a", accent: "#bccfb0" },
  teal: { label: "Teal", main: "#11474b", accent: "#a9ccc8" },
  harbor: { label: "Harbor", main: "#1f3a56", accent: "#a9bcc9" },
  cocoa: { label: "Cocoa", main: "#4e342e", accent: "#d6bba8" },
} as const;

export type ThemeId = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = "plum";

export const isThemeId = (id: string | null | undefined): id is ThemeId => id != null && id in THEMES;
export const themeOf = (id: string | null | undefined) => THEMES[isThemeId(id) ? id : DEFAULT_THEME];
