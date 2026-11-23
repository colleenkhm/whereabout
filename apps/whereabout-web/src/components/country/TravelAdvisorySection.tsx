import { advisoryColor, cssVars } from "@/lib/color";
import { formatShortDate } from "@/lib/format";
import type { TravelAdvisory } from "@/lib/types";
import SectionSource from "./SectionSource";
import section from "./Section.module.css";

const levelNumber = (a: TravelAdvisory) => {
  const m = /(\d+)/.exec(a.level ?? "");
  return m ? Number(m[1]) : null;
};

export default function TravelAdvisorySection({ advisories, accent }: { advisories: TravelAdvisory[]; accent: string }) {
  return (
    <div className={section.pad}>
      {advisories.map((a) => {
        const level = levelNumber(a);
        return (
          <div key={a.issuingAuthority} className={section.divided}>
            <div className="s-label">{a.issuingAuthority}</div>
            {(a.level || a.levelLabel) && (
              <div className={`s-head ${section.headline} ${section.level}`} style={cssVars({ "--level": level == null ? undefined : advisoryColor(level) })}>
                {[a.level, a.levelLabel].filter(Boolean).join(" — ")}
              </div>
            )}
            {a.summary && (
              <p className={`s-body ${section.lead}`}>
                {a.summary}
              </p>
            )}
            <SectionSource
              notes={[...(a.issuedAt ? [`Issued ${formatShortDate(a.issuedAt)}`] : []), `Checked ${formatShortDate(a.lastVerifiedAt)}`]}
              links={[["Full advisory", a.officialUrl]]}
              color={accent}
            />
          </div>
        );
      })}
    </div>
  );
}
