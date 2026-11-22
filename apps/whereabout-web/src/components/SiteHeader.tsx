import Link from "next/link";
import LogoMark from "./LogoMark";

// Site-wide nav: logo mark + wordmark, links home. Not on the home page.
export default function SiteHeader() {
  return (
    <header style={{ background: "var(--ink)", padding: "16px 20px" }}>
      <Link
        href="/"
        title="Home"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#fff" }}
      >
        <LogoMark size={22} />
        <span
          style={{
            fontFamily: "var(--fraunces)",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: -0.1,
          }}
        >
          whereabout
        </span>
      </Link>
    </header>
  );
}
