// "BETA" label. Flat, no shadow, so it doesn't read as a button.
// outline: beside the wordmark, in the header's text color. filled: plain ink label over the home flags; the white tags beside it are the links.
export default function BetaTag({ variant = "outline" }: { variant?: "outline" | "filled" }) {
  const style: React.CSSProperties =
    variant === "filled"
      ? { padding: "6px 10px", background: "var(--ink)", color: "#fff" }
      : { padding: "2px 5px", border: "1px solid currentColor", fontSize: 9 };
  return (
    <span className="tf-link" style={{ borderRadius: 3, lineHeight: 1, whiteSpace: "nowrap", ...style }}>
      BETA
    </span>
  );
}
