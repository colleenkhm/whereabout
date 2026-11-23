import Link from "next/link";
import { readableTextColor } from "@/lib/color";
import BetaTag from "./BetaTag";
import ContributeLink from "./ContributeLink";
import LogoMark from "./LogoMark";
import styles from "./SiteHeader.module.css";

// Site-wide nav: logo mark + wordmark, links home. Not on the home page.
// background: a flag color contrasting the masthead below (country page); default is the ink bar.
export default function SiteHeader({ background }: { background?: string }) {
  const text = background ? readableTextColor(background) : "#fff";
  return (
    <header
      className={background ? styles.blended : undefined}
      style={
        background
          ? ({ "--bg": background } as React.CSSProperties)
          : { background: "var(--ink)", padding: "16px 20px" }
      }
    >
      {/* Window corner on the country variant; content-width otherwise. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          color: text,
          ...(background ? {} : { maxWidth: "calc(var(--content-max) - 40px)", margin: "0 auto" }),
        }}
      >
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
          <span style={{ marginLeft: 4 }}>
            <BetaTag />
          </span>
        </Link>
        <ContributeLink />
      </div>
    </header>
  );
}
