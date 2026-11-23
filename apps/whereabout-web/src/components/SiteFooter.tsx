import Link from "next/link";
import { readableTextColor } from "@/lib/color";

// Sources link (licenses need it findable everywhere). Ink tag with a white offset shadow; accent tags get an ink one.
// accent: the country's flag color in place of ink.
export default function SiteFooter({ accent }: { accent?: string }) {
  return (
    <footer style={{ position: "relative", padding: "28px 0", textAlign: "center" }}>
      <Link
        href="/about"
        style={{
          display: "inline-block",
          padding: "10px 18px",
          background: accent ?? "var(--ink)",
          border: "2px solid var(--ink)",
          borderRadius: 4,
          color: accent ? readableTextColor(accent) : "#fff",
          fontFamily: "var(--dm-mono)",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 1,
          boxShadow: `4px 4px 0 ${accent ? "var(--ink)" : "#fff"}`,
        }}
      >
        SOURCES &amp; CREDITS
      </Link>
    </footer>
  );
}
