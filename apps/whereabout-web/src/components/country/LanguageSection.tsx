import { MdStar } from "react-icons/md";
import { cssVars, sectionVars, type SectionColors } from "@/lib/color";
import { contributeHref } from "@/lib/contribute";
import type { LanguageEntry } from "@/lib/types";
import SectionSource from "./SectionSource";
import styles from "./LanguageSection.module.css";

const MIN_SHOWN = 3;
const MAX_SHOWN = 5;
const WIDELY_SPOKEN = 30;
// Many large language groups; always show MAX_SHOWN.
const MANY_LANGUAGE_COUNTRIES = new Set(["ZA", "IN", "CN", "RU", "CH"]);

// By verified percent, then display rank, then official.
export function sortLanguages(languages: LanguageEntry[]): LanguageEntry[] {
  return [...languages].sort(
    (a, b) =>
      (b.percentSpeakers ?? -1) - (a.percentSpeakers ?? -1) ||
      (a.displayRank ?? 2 ** 30) - (b.displayRank ?? 2 ** 30) ||
      Number(b.isOfficial) - Number(a.isOfficial),
  );
}

// Sorted, capped; English always shown.
function displayLanguages(languages: LanguageEntry[], iso: string): LanguageEntry[] {
  const sorted = sortLanguages(languages);
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
  if (languages.length === 0)
    return (
      <div className={styles.panel} style={sectionVars(colors)}>
        <MissingCensus isoCode={isoCode} what="language" />
      </div>
    );

  const shown = displayLanguages(languages, isoCode);
  const anyPercent = languages.some((l) => l.percentSpeakers != null);
  // URL -> short label, deduped. Citations required by source terms.
  const sources = new Map<string, string>();
  for (const l of shown) if (l.sourceUrl && l.source) sources.set(l.sourceUrl, l.source.split(",")[0].trim());

  return (
    <div className={styles.panel} style={sectionVars(colors)}>
      {shown.map((l) => (
        <div key={l.name} className={styles.entry}>
          <div className={styles.nameRow}>
            <span className={`row-title ${styles.name}`}>{l.name}</span>
            {l.isOfficial && (
              <span className={styles.official}>
                <MdStar size={11} aria-hidden />
                official
              </span>
            )}
          </div>
          {/* No bar without a sourced figure: unknown is not zero. */}
          {l.percentSpeakers != null && (
            <div className={styles.barRow}>
              <div className={styles.track}>
                <div className={styles.fill} style={cssVars({ "--percent": `${Math.min(100, Math.max(0, l.percentSpeakers))}%` })} />
              </div>
              <span className={styles.percent}>{formatPercent(l.percentSpeakers)}</span>
            </div>
          )}
          {l.usageNote && <p className={styles.note}>{l.usageNote}</p>}
        </div>
      ))}
      {!anyPercent && <MissingCensus isoCode={isoCode} what="speaker" />}
      {sources.size > 0 && <SectionSource links={[...sources].map(([url, label]) => [label, url])} color={colors.textColor} />}
    </div>
  );
}

// No census to cite: say so, and point to the add/dispute form.
function MissingCensus({ isoCode, what }: { isoCode: string; what: "language" | "speaker" }) {
  return (
    <p className={`s-body ${styles.missing}`}>
      No {what} census data available for this country. Please{" "}
      {/* Full load: contribute mode is read from the URL on mount. */}
      <a href={contributeHref(isoCode)}>fill out this form</a> to add information about this country.
    </p>
  );
}
