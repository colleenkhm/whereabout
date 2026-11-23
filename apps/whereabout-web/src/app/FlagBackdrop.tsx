import Image from "next/image";
import { POSTAGE_TILTS } from "@/components/country/PostageCard";
import { cssVars } from "@/lib/color";
import { flagPngUrl } from "@/lib/flagPalette";
import type { CountrySummary } from "@/lib/types";
import styles from "./FlagBackdrop.module.css";

// Enough rows to cover a tall screen; overflow is clipped.
const ROWS = 12;

// Stable shuffle so neighbors aren't alphabetical; same on server and client.
const scramble = (iso: string) => [...iso].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7);

// Decorative tilted flags behind the search, rows drifting in alternating directions. Not interactive.
export default function FlagBackdrop({ countries }: { countries: CountrySummary[] }) {
  const flags = [...countries].sort((a, b) => scramble(a.isoCode) - scramble(b.isoCode));
  const perRow = Math.ceil(flags.length / ROWS);
  const rows = Array.from({ length: ROWS }, (_, r) => flags.slice(r * perRow, (r + 1) * perRow));
  return (
    <div className={styles.backdrop} aria-hidden>
      <div className={styles.rows}>
        {rows.map((row, r) => (
          <div key={r} className={styles.row}>
            {/* Two copies so the loop is seamless. */}
            <div className={`${styles.track} ${r % 2 ? styles.reverse : ""}`}>
              {[0, 1].flatMap((copy) =>
                row.map((c, i) => (
                  <span
                    key={`${copy}-${c.isoCode}`}
                    className={styles.flag}
                    style={cssVars({ "--tilt": `${POSTAGE_TILTS[(r * perRow + i) % POSTAGE_TILTS.length] * 3}deg` })}
                  >
                    <span className={styles.art}>
                      <Image src={flagPngUrl(c.isoCode)} alt="" fill sizes="110px" loading="lazy" unoptimized />
                    </span>
                  </span>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
