import Link from "next/link";

// Sources link (licenses need it findable everywhere). Ink tag like the search panel.
export default function SiteFooter() {
  return (
    <footer style={{ position: "relative", padding: "28px 0", textAlign: "center" }}>
      <Link
        href="/about"
        style={{
          display: "inline-block",
          padding: "10px 18px",
          background: "var(--ink)",
          border: "2px solid var(--ink)",
          borderRadius: 4,
          color: "#fff",
          fontFamily: "var(--dm-mono)",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 1,
        }}
      >
        SOURCES &amp; CREDITS
      </Link>
    </footer>
  );
}
