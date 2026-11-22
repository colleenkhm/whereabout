import { withAlpha, type SectionColors } from "@/lib/color";
import type { BestTime } from "@/lib/types";

// Two-up month squares, one per month, cycling flag colors.
export default function BestTimesSection({ bestTimes, palette }: { bestTimes: BestTime[]; palette: SectionColors[] }) {
  const squares = bestTimes.flatMap((bt) => bt.months.split(",").map((m) => ({ month: m.trim(), bt })));
  return (
    <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {squares.map(({ month, bt }, i) => {
        const c = palette[i % palette.length];
        const soft = withAlpha(c.textColor, 0.85);
        return (
          <div key={`${month}-${i}`} style={{ background: c.tint, padding: "13px 14px 14px" }}>
            <div className="s-head" style={{ fontSize: 17, color: c.textColor }}>
              {month}
            </div>
            <p className="s-body" style={{ marginTop: 3, fontSize: 12, fontWeight: 600, fontStyle: "italic", color: soft }}>
              ({bt.whyShort})
            </p>
            <p className="s-body" style={{ marginTop: 6, fontSize: 12.5, color: soft }}>
              {bt.why}
            </p>
          </div>
        );
      })}
    </div>
  );
}
