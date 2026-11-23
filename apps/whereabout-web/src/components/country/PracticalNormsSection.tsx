import { MdInfoOutline, MdOutlineDirectionsCar, MdOutlinePayments, MdOutlineSchedule } from "react-icons/md";
import { sectionVars, type SectionColors } from "@/lib/color";
import type { NormItem } from "@/lib/types";
import section from "./Section.module.css";
import styles from "./PracticalNormsSection.module.css";

// Generic glyph for an unrecognized type.
const ICONS: Record<string, typeof MdInfoOutline> = {
  tipping_norm: MdOutlinePayments,
  punctuality_norm: MdOutlineSchedule,
  transport_norm: MdOutlineDirectionsCar,
};

export default function PracticalNormsSection({ norms, colors }: { norms: NormItem[]; colors: SectionColors }) {
  return (
    <div className={section.tinted} style={sectionVars(colors)}>
      {norms.map((n) => {
        const Icon = ICONS[n.type] ?? MdInfoOutline;
        return (
          <div key={n.title} className={styles.norm}>
            <Icon size={18} className={styles.icon} aria-hidden />
            <div>
              <div className={`row-title ${styles.title}`}>{n.title}</div>
              <p className={`s-body ${styles.body}`}>{n.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
