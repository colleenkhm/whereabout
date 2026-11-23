import Link from "next/link";
import { tagClass } from "./linkTags";
import styles from "./SiteFooter.module.css";

// Sources link (licenses need it findable everywhere): ink bar, bold underlined white text.
// onFlags: home page, no bar, the over-the-flags tag like its GET INVOLVED.
export default function SiteFooter({ onFlags }: { onFlags?: boolean }) {
  if (onFlags)
    return (
      <footer className={styles.onFlags}>
        <Link href="/about" className={tagClass("filled")}>
          SOURCES &amp; CREDITS
        </Link>
      </footer>
    );
  return (
    <footer className={styles.bar}>
      <Link href="/about" className={`tf-link lift ${styles.barLink}`}>
        SOURCES &amp; CREDITS
      </Link>
    </footer>
  );
}
