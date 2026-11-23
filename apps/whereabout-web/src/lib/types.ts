// Client data shapes for V1 country pages. Dates stay ISO strings so
// bundles pass from server to client components unchanged.

export type ContentStatus = "none" | "partial" | "complete";
export type CrowdLevel = "low" | "moderate" | "high" | "peak";
export type Severity = "fyi" | "important" | "critical";

export interface CountrySummary {
  isoCode: string;
  nameCommon: string;
}

export interface Country {
  id: string;
  isoCode: string;
  nameCommon: string;
  nameOfficial: string;
  contentStatus: ContentStatus;
}

// percentSpeakers is null unless verified, never guessed.
export interface LanguageEntry {
  name: string;
  isOfficial: boolean;
  percentSpeakers: number | null;
  usageNote: string | null;
  displayRank: number | null;
  source: string | null;
  sourceUrl: string | null;
}

export interface Climate {
  koppen: string;
  label: string | null;
  regions: string | null;
}

// borderingCountryCodes: [] = island, null = no facts imported.
export interface CountryFacts {
  capital: string | null;
  population: number | null;
  currencyCode: string | null;
  currencyName: string | null;
  callingCode: string | null;
  languages: LanguageEntry[];
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  lastImportedAt: string | null;
  borderingCountryCodes: string[] | null;
  climates: Climate[];
  // Language name -> country name in that language.
  nativeNames: Record<string, string>;
}

export interface City {
  id: string;
  name: string;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  isFeatured: boolean;
}

export interface BestTime {
  months: string;
  whyShort: string;
  why: string;
  crowdLevel: CrowdLevel;
}

export interface NormItem {
  type: string;
  title: string;
  body: string;
  severity: Severity;
}

export interface CountryGuide {
  bestTimes: BestTime[];
  practicalNorms: NormItem[];
  lastReviewedAt: string | null;
}

export interface TravelAdvisory {
  issuingAuthority: string;
  level: string | null;
  levelLabel: string | null;
  summary: string | null;
  officialUrl: string;
  issuedAt: string | null;
  lastVerifiedAt: string;
}

export interface VisaInfo {
  issuingAuthority: string;
  summary: string;
  officialUrl: string;
  applicationUrl: string | null;
  lastVerifiedAt: string;
  nationalityIsoCode: string;
  prohibitedOnEntry: string | null;
  prohibitedOnExit: string | null;
}

export interface Word {
  id: string;
  lemma: string;
  translation: string;
  partOfSpeech: string | null;
  gender: string | null;
  pronunciation: string | null;
  ipa: string | null;
  usageNote: string | null;
  difficulty: number | null;
}

export interface CountryBundle {
  country: Country;
  facts: CountryFacts;
  cities: City[];
  guide: CountryGuide;
  words: Word[];
  advisories: TravelAdvisory[];
  visa: VisaInfo | null;
  fetchedAt: string;
}

export interface ExchangeRate {
  currencyCode: string;
  rateFromUsd: number;
  fetchedAt: string;
}
