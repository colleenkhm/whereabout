import { cssVars } from "@/lib/color";
import ExternalLink from "../ExternalLink";
import styles from "./SectionSource.module.css";

// Source footer for every section: notes left, links right. list: under a row list (see CSS).
export default function SectionSource({
  links,
  color,
  notes = [],
  list = false,
}: {
  links: [string, string][];
  color: string;
  notes?: string[];
  list?: boolean;
}) {
  return (
    <div className={`${styles.source} ${list ? styles.list : ""}`} style={cssVars({ "--src": color })}>
      {notes.length > 0 && (
        <div className={styles.wrap}>
          {notes.map((n) => (
            <span key={n} className="src-row">
              {n}
            </span>
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div className={`${styles.wrap} ${styles.links}`}>
          {links.map(([label, url]) => (
            <ExternalLink key={url} label={label} url={url} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}
