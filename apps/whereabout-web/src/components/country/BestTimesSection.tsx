import { sectionVars, type SectionColors } from "@/lib/color";
import type { BestTime } from "@/lib/types";
import styles from "./BestTimesSection.module.css";

const MAX_MONTHS = 4;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// One square per month, cycling flag colors. Capped at MAX_MONTHS, in calendar order.
export default function BestTimesSection({ bestTimes, palette }: { bestTimes: BestTime[]; palette: SectionColors[] }) {
  return (
    <div className={styles.grid}>
      {pickMonths(bestTimes).map(({ month, bt }, i) => (
        <div key={month} className={styles.square} style={sectionVars(palette[i % palette.length])}>
          <div className={`s-head ${styles.month}`}>{month}</div>
          {shortLabel(bt.whyShort) && <p className={`s-body ${styles.short}`}>({shortLabel(bt.whyShort)})</p>}
          <p className={`s-body ${styles.why}`}>{whyText(bt.why)}</p>
        </div>
      ))}
    </div>
  );
}

// Round-robin across entries so every reason gets a month (each month once), then calendar order.
function pickMonths(bestTimes: BestTime[]) {
  const queues = bestTimes.map((bt) => bt.months.split(",").map((m) => ({ month: m.trim(), bt })));
  const picked: { month: string; bt: BestTime }[] = [];
  const longest = Math.max(0, ...queues.map((q) => q.length));
  for (let round = 0; round < longest; round++) {
    for (const q of queues) {
      const next = q[round];
      if (next && picked.length < MAX_MONTHS && !picked.some((p) => p.month === next.month)) picked.push(next);
    }
  }
  return picked.sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
}

// The square already names its month: drop a leading month list ("June and September: ").
const MONTH_WORDS = new RegExp(`^(?:(?:${MONTHS.join("|")})(?:,\\s*|\\s+and\\s+|\\s*)?)+(?::\\s*|$)`);
const shortLabel = (s: string) => s.replace(MONTH_WORDS, "").trim();

// Drop a "Best months to visit — " lead-in; every square is a best month.
const whyText = (s: string) => {
  const rest = s.replace(/^best (?:months?|times?)\b[^—–:]*[—–:]\s*/i, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
};
