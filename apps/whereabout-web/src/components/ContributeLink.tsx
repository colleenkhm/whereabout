import Link from "next/link";

// Top-right "Contribute" tag.
// outline: header row, in the header's text color. filled: ink tag over the home stamps, sized like the footer's.
export default function ContributeLink({ variant = "outline" }: { variant?: "outline" | "filled" }) {
  const style: React.CSSProperties =
    variant === "filled"
      ? { padding: "10px 16px", background: "var(--ink)", color: "#fff", fontSize: 13, boxShadow: "4px 4px 0 #fff" }
      : { padding: "6px 10px", border: "1.4px solid currentColor" };
  return (
    <Link href="/contribute" className="tf-link" style={{ borderRadius: 4, whiteSpace: "nowrap", ...style }}>
      CONTRIBUTE
    </Link>
  );
}
