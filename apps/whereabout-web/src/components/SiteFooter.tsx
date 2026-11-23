import Link from "next/link";
import { readableTextColor } from "@/lib/color";

// Home page links over the moving flags: white with an ink outline and offset shadow, like the search bar.
export const ON_FLAGS_LINK: React.CSSProperties = {
  background: "#fff",
  color: "var(--ink)",
  border: "2px solid var(--ink)",
  boxShadow: "4px 4px 0 var(--ink)",
};

// Sources link (licenses need it findable everywhere). Ink tag with a white offset shadow; accent tags get an ink one.
// accent: the country's flag color in place of ink. onFlags: home page, white like the search bar.
export default function SiteFooter({ accent, onFlags }: { accent?: string; onFlags?: boolean }) {
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
          ...(onFlags ? ON_FLAGS_LINK : {}),
        }}
      >
        SOURCES &amp; CREDITS
      </Link>
    </footer>
  );
}
