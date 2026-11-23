// Shared look for the GET INVOLVED / SOURCES & CREDITS tags, so header and footer always match.
// outline: colored header/footer bar, in its text color. white: ink bar. filled: home page, over the flags.
export type TagVariant = "outline" | "white" | "filled";

export function tagStyle(variant: TagVariant): React.CSSProperties {
  const base = { padding: "6px 10px", borderRadius: 4, whiteSpace: "nowrap" } as const;
  if (variant === "filled")
    return {
      ...base,
      padding: "10px 16px",
      fontSize: 13,
      background: "#fff",
      color: "var(--ink)",
      border: "2px solid var(--ink)",
      boxShadow: "4px 4px 0 var(--ink)",
    };
  if (variant === "white") return { ...base, background: "#fff", color: "var(--ink)", border: "1.4px solid #fff" };
  return { ...base, border: "1.4px solid currentColor", boxShadow: "3px 3px 0 var(--ink)" };
}
