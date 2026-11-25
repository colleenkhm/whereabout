import Link from "next/link";
import { cssVars, readableTextColor } from "@/lib/color";
import { AccountLink } from "./AccountsGate";
import BetaTag from "./BetaTag";
import ContributeLink from "./ContributeLink";
import LogoMark from "./LogoMark";
import styles from "./SiteHeader.module.css";

// Site-wide nav: logo mark + wordmark, links home. Not on the home page.
// background: a flag color contrasting the masthead below (country page); default is the ink bar.
export default function SiteHeader({ background }: { background?: string }) {
  const text = background ? readableTextColor(background) : "#fff";
  return (
    <header className={background ? styles.blended : styles.ink} style={cssVars({ "--bg": background, "--text": text, "--tag-shadow": text === "#ffffff" ? "#ffffff" : undefined })}>
      {/* Window corner on the country variant; content-width otherwise. */}
      <div className={styles.row}>
        <Link href="/" title="Home" className={styles.home}>
          <LogoMark size={22} />
          <span className={styles.wordmark}>whereabout</span>
          <span className={styles.beta}>
            <BetaTag />
          </span>
        </Link>
        <div className={styles.links}>
          <ContributeLink variant={background ? "outline" : "white"} />
          <AccountLink variant={background ? "outline" : "white"} />
        </div>
      </div>
    </header>
  );
}
