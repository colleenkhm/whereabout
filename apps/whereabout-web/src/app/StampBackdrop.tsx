import Image from "next/image";
import { POSTAGE_TILTS } from "@/components/country/PostageCard";
import { flagPngUrl } from "@/lib/flagPalette";
import type { CountrySummary } from "@/lib/types";
import styles from "./StampBackdrop.module.css";

// Enough to cover a large screen; overflow is clipped.
const COUNT = 180;

// Stable shuffle so neighbors aren't alphabetical; same on server and client.
const scramble = (iso: string) => [...iso].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7);

// Decorative tilted flags behind the search. Not interactive.
export default function StampBackdrop({ countries }: { countries: CountrySummary[] }) {
  const stamps = [...countries].sort((a, b) => scramble(a.isoCode) - scramble(b.isoCode)).slice(0, COUNT);
  return (
    <div className={styles.backdrop} aria-hidden>
      <div className={styles.grid}>
        {stamps.map((c, i) => (
          <span
            key={c.isoCode}
            className={styles.stamp}
            style={{ "--tilt": `${POSTAGE_TILTS[i % POSTAGE_TILTS.length] * 3}deg` } as React.CSSProperties}
          >
            <span className={styles.art}>
              <Image src={flagPngUrl(c.isoCode)} alt="" fill sizes="110px" loading="lazy" unoptimized />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
