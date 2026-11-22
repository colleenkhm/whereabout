import { advisoryColor } from "@/lib/color";
import { formatShortDate } from "@/lib/format";
import type { TravelAdvisory } from "@/lib/types";
import SectionSource from "./SectionSource";

const levelNumber = (a: TravelAdvisory) => {
  const m = /(\d+)/.exec(a.level ?? "");
  return m ? Number(m[1]) : null;
};

export default function TravelAdvisorySection({ advisories, accent }: { advisories: TravelAdvisory[]; accent: string }) {
  return (
    <div style={{ padding: "16px 20px" }}>
      {advisories.map((a, i) => {
        const level = levelNumber(a);
        return (
          <div key={a.issuingAuthority} style={i ? { marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--rule)" } : undefined}>
            <div className="s-label">{a.issuingAuthority}</div>
            {(a.level || a.levelLabel) && (
              <div className="s-head" style={{ marginTop: 5, color: level == null ? "var(--ink)" : advisoryColor(level) }}>
                {[a.level, a.levelLabel].filter(Boolean).join(" — ")}
              </div>
            )}
            {a.summary && (
              <p className="s-body" style={{ marginTop: 6 }}>
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
