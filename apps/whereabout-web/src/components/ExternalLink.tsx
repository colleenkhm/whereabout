import { MdArrowOutward } from "react-icons/md";
import { cssVars } from "@/lib/color";
import styles from "./ExternalLink.module.css";

// "Label ↗" link, opens in a new tab. Default color: sky.
export default function ExternalLink({ label, url, color }: { label: string; url: string; color?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.link} style={cssVars({ "--link": color })}>
      {label}
      <MdArrowOutward size={11} className={styles.arrow} aria-hidden />
    </a>
  );
}
