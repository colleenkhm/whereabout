import { MdInfoOutline, MdOutlineDirectionsCar, MdOutlinePayments, MdOutlineSchedule } from "react-icons/md";
import { withAlpha, type SectionColors } from "@/lib/color";
import type { NormItem } from "@/lib/types";

// Generic glyph for an unrecognized type.
const ICONS: Record<string, typeof MdInfoOutline> = {
  tipping_norm: MdOutlinePayments,
  punctuality_norm: MdOutlineSchedule,
  transport_norm: MdOutlineDirectionsCar,
};

export default function PracticalNormsSection({ norms, colors }: { norms: NormItem[]; colors: SectionColors }) {
  const { tint, textColor } = colors;
  const soft = withAlpha(textColor, 0.85);
  return (
    <div style={{ background: tint }}>
      {norms.map((n, i) => {
        const Icon = ICONS[n.type] ?? MdInfoOutline;
        return (
          <div
            key={n.title}
            style={{
              display: "flex",
              gap: 13,
              padding: "13px 20px",
              borderTop: i ? `1px solid ${withAlpha(textColor, 0.12)}` : "none",
            }}
          >
            <Icon size={18} color={soft} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
            <div>
              <div className="row-title" style={{ fontSize: 13.5, color: textColor }}>
                {n.title}
              </div>
              <p className="s-body" style={{ marginTop: 2, fontSize: 12.5, color: soft }}>
                {n.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
