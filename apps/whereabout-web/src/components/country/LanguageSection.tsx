import { MdStar } from "react-icons/md";
import { withAlpha, type SectionColors } from "@/lib/color";
import type { LanguageEntry } from "@/lib/types";
import SectionSource from "./SectionSource";

const MIN_SHOWN = 3;
const MAX_SHOWN = 5;
const WIDELY_SPOKEN = 30;
// Many large language groups; always show MAX_SHOWN.
const MANY_LANGUAGE_COUNTRIES = new Set(["ZA", "IN", "CN", "RU", "CH"]);

// By verified percent, then display rank, then official. English always shown.
function displayLanguages(languages: LanguageEntry[], iso: string): LanguageEntry[] {
  const sorted = [...languages].sort(
    (a, b) =>
      (b.percentSpeakers ?? -1) - (a.percentSpeakers ?? -1) ||
      (a.displayRank ?? 2 ** 30) - (b.displayRank ?? 2 ** 30) ||
      Number(b.isOfficial) - Number(a.isOfficial),
  );
  const widely = sorted.filter((l) => (l.percentSpeakers ?? 0) >= WIDELY_SPOKEN).length;
  const floor = MANY_LANGUAGE_COUNTRIES.has(iso) ? MAX_SHOWN : MIN_SHOWN;
  const shown = sorted.slice(0, Math.min(MAX_SHOWN, Math.max(floor, widely)));
  const isEnglish = (l: LanguageEntry) => l.name.toLowerCase() === "english";
  if (!shown.some(isEnglish)) {
    if (shown.length === MAX_SHOWN) shown.pop();
    shown.push(
      sorted.find(isEnglish) ?? {
        name: "English",
        isOfficial: false,
        percentSpeakers: null,
        usageNote: null,
        displayRank: null,
        source: null,
        sourceUrl: null,
      },
    );
  }
  return shown;
}

const formatPercent = (p: number) => `${Number.isInteger(p) ? p : p.toFixed(1)}%`;

export default function LanguageSection({
  languages,
  isoCode,
  colors,
}: {
  languages: LanguageEntry[];
  isoCode: string;
  colors: SectionColors;
}) {
  const { tint, textColor } = colors;
  const shown = displayLanguages(languages, isoCode);
  // URL -> short label, deduped. Citations required by source terms.
  const sources = new Map<string, string>();
  for (const l of shown) if (l.sourceUrl && l.source) sources.set(l.sourceUrl, l.source.split(",")[0].trim());

  return (
    <div style={{ background: tint, padding: "14px 16px", color: textColor }}>
      {shown.map((l, i) => (
        <div key={l.name}>
          {i > 0 && <div style={{ height: 1, margin: "5px 0", background: withAlpha(textColor, 0.15) }} />}
          <div style={{ padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="row-title" style={{ flex: 1, color: textColor }}>
                {l.name}
              </span>
              {l.isOfficial && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--dm-mono)", fontSize: 9, fontWeight: 600, letterSpacing: 0.3 }}>
                  <MdStar size={11} aria-hidden />
                  official
                </span>
              )}
            </div>
            {/* No bar without a sourced figure: unknown is not zero. */}
            {l.percentSpeakers != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 2.5, background: withAlpha(textColor, 0.15), overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, l.percentSpeakers))}%`,
                      height: "100%",
                      background: withAlpha(textColor, 0.85),
                    }}
                  />
                </div>
                <span style={{ fontFamily: "var(--dm-mono)", fontSize: 11, fontWeight: 700 }}>{formatPercent(l.percentSpeakers)}</span>
              </div>
            )}
            {l.usageNote && (
              <p
                style={{
                  marginTop: 3,
                  fontFamily: "var(--dm-mono)",
                  fontSize: 10,
                  fontStyle: "italic",
                  color: withAlpha(textColor, 0.75),
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {l.usageNote}
              </p>
            )}
          </div>
        </div>
      ))}
      {sources.size > 0 && <SectionSource links={[...sources].map(([url, label]) => [label, url])} color={textColor} />}
    </div>
  );
}
