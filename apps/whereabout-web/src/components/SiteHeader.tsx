import Link from "next/link";
import { MdPublic } from "react-icons/md";

// Site-wide nav: globe + wordmark, links home.
export default function SiteHeader({ background = "var(--ink)" }: { background?: string }) {
  return (
    <header style={{ background, padding: "16px 20px" }}>
      <Link
        href="/"
        title="Home"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff" }}
      >
        <MdPublic size={22} style={{ opacity: 0.85 }} aria-hidden />
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
