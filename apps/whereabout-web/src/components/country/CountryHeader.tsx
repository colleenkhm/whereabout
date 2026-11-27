"use client";

import { cssVars, isWhitish, readableTextColor, type SectionColors } from "@/lib/color";
import type { ExchangeRate, LanguageEntry } from "@/lib/types";
import { CountryMarks } from "../AccountsGate";
import SiteHeader from "../SiteHeader";
import { FlagStamp } from "../Stamp";
import { DeparturesBar } from "./LocalFacts";
import { sortLanguages } from "./LanguageSection";
import styles from "./CountryHeader.module.css";

interface Props {
  isoCode: string;
  name: string;
  languages: LanguageEntry[];
  nativeNames: Record<string, string>;
  timezone: string | null;
  latitude: number | null;
  exchangeRate: ExchangeRate | null;
  currencyName: string | null;
  currencyCode: string | null;
  header: SectionColors;
  nav: string;
  onOpenDetails: () => void;
  onOpenConverter: () => void;
}

// Logo row (color 1), masthead (color 2) and the ink departures bar all stick.
export default function CountryHeader(p: Props) {
  const hasFacts = p.timezone != null || p.currencyCode != null;
  // Hidden with the facts (contribute mode).
  const hemisphere = hasFacts ? hemisphereOf(p.latitude) : null;
  const colors = cssVars({ "--c2": p.nav, "--c2-ink": readableTextColor(p.nav) });
  return (
    <>
      <div className={styles.sticky} style={colors}>
        <SiteHeader background={p.header.tint} />
        <div className={styles.masthead}>
          <div className={styles.inner}>
            <div className={styles.titleCol}>
              <div className={`tk-eyebrow ${styles.eyebrow}`}>DESTINATION</div>
              <h1 className={styles.name}>{p.name}</h1>
              {hemisphere && <div className={`tf-sub ${styles.hemisphere}`}>{hemisphere}</div>}
              {hasFacts && <CountryMarks isoCode={p.isoCode} />}
            </div>
            <div className={styles.flagCol}>
              <FlagStamp
                isoCode={p.isoCode}
                label={nativeName(p.name, p.languages, p.nativeNames)}
                outlined={isWhitish(p.nav)}
              />
            </div>
          </div>
        </div>
        {hasFacts && <DeparturesBar {...p} onOpen={p.onOpenDetails} onConvert={p.onOpenConverter} />}
      </div>
    </>
  );
}

// Most-spoken non-English language with a native name; else first non-English; else English.
function nativeName(
  english: string,
  languages: LanguageEntry[],
  names: Record<string, string>,
): string {
  const local = Object.entries(names).filter(([lang]) => lang !== "English");
  const byRank = sortLanguages(languages).find((l) =>
    local.some(([lang]) => lang === l.name),
  );
  return (byRank && names[byRank.name]) ?? local[0]?.[1] ?? english;
}

const hemisphereOf = (latitude: number | null) =>
  latitude == null
    ? null
    : latitude === 0
      ? "On the Equator"
      : latitude > 0
        ? "Northern Hemisphere"
        : "Southern Hemisphere";
