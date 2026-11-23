import Link from "next/link";
import { ON_FLAGS_LINK } from "./SiteFooter";

// Top-right "Contribute" tag.
// outline: header row, in the header's text color, ink offset shadow. filled: white tag over the home flags, like the search bar, sized like the footer's.
export default function ContributeLink({ variant = "outline" }: { variant?: "outline" | "filled" }) {
  const style: React.CSSProperties =
    variant === "filled"
      ? { padding: "10px 16px", fontSize: 13, ...ON_FLAGS_LINK }
      : { padding: "6px 10px", border: "1.4px solid currentColor", boxShadow: "3px 3px 0 var(--ink)" };
  return (
    <Link href="/contribute" className="tf-link" style={{ borderRadius: 4, whiteSpace: "nowrap", ...style }}>
      CONTRIBUTE
    </Link>
  );
}
