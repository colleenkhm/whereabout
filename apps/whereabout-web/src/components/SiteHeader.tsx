import Link from "next/link";
import { readableTextColor, withAlpha } from "@/lib/color";
import LogoMark from "./LogoMark";
import styles from "./SiteHeader.module.css";

// Site-wide nav: logo mark + wordmark, links home. Not on the home page.
// colors: blend into a masthead below (country page); default is the ink bar.
// background: the country's deeper shade, sitting above its masthead; default is the ink bar.
export default function SiteHeader({ background }: { background?: string }) {
  const text = background ? readableTextColor(background) : "#fff";
  return (
    <header
      className={background ? styles.blended : undefined}
      style={
        background
          ? ({ "--bg": background, "--divider": withAlpha(text, 0.4) } as React.CSSProperties)
          : { background: "var(--ink)", padding: "16px 20px" }
      }
    >
      {/* Window corner on the country variant; content-width otherwise. */}
      <div style={background ? undefined : { maxWidth: "calc(var(--content-max) - 40px)", margin: "0 auto" }}>
        <Link
          href="/"
          title="Home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: text,
          }}
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
      </div>
    </header>
  );
}
