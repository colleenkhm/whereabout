import Link from "next/link";
import { tagStyle } from "./linkTags";

// Sources link (licenses need it findable everywhere): ink bar, bold underlined white text.
// onFlags: home page, no bar, the over-the-flags tag like its GET INVOLVED.
export default function SiteFooter({ onFlags }: { onFlags?: boolean }) {
  if (onFlags)
    return (
      <footer style={{ position: "relative", padding: "28px 0", textAlign: "center" }}>
        <Link href="/about" className="tf-link" style={{ display: "inline-block", ...tagStyle("filled") }}>
          SOURCES &amp; CREDITS
        </Link>
      </footer>
    );
  return (
    <footer style={{ marginTop: "auto", padding: "16px 20px", background: "var(--ink)", textAlign: "center" }}>
      <Link
        href="/about"
        className="tf-link"
        style={{ color: "#fff", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}
      >
        SOURCES &amp; CREDITS
      </Link>
    </footer>
  );
}
