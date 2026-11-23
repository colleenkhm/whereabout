// Port of the Flutter SupabaseCountryRepository.
import { supabase } from "./supabase";
import type {
  BestTime,
  City,
  CountryBundle,
  CountryFacts,
  CountryGuide,
  CountrySummary,
  CrowdLevel,
  LanguageEntry,
  NormItem,
  Severity,
  TravelAdvisory,
  VisaInfo,
  Word,
} from "./types";

// Keep in sync with STALE_AFTER_DAYS in refresh-country-state-dept.
const STATE_DEPT_STALE_AFTER_DAYS = 30;

type Row = Record<string, unknown>;

const COUNTRY_SELECT = `
  id, iso_code, name_common, name_official, content_status,
  country_facts(*),
  cities(*),
  country_guides(*),
  country_languages(is_official, display_rank, percent_speakers, percent_status, percent_speakers_source, percent_source_url, usage_note, languages(name)),
  travel_advisories(*),
  visa_requirements!destination_country_id(*),
  words(*)
`;

export async function listCountries(): Promise<CountrySummary[]> {
  const { data, error } = await supabase()
    .from("countries")
    .select("iso_code, name_common")
    .order("name_common");
  if (error) throw error;
  return (data ?? []).map((r) => ({ isoCode: r.iso_code, nameCommon: r.name_common }));
}

// Plain fetch, no refresh. Safe at build time.
export async function fetchCountryBundle(
  isoCode: string,
  passportIso = "US",
): Promise<CountryBundle | null> {
  const row = await fetchCountryRow(isoCode, passportIso);
  return row ? toBundle(row, passportIso) : null;
}

// Browser only: refreshes stale State Dept rows, then refetches.
export async function refreshIfStale(
  bundle: CountryBundle,
  passportIso = "US",
): Promise<CountryBundle | null> {
  if (!isStateDeptStale(bundle, passportIso)) return null;
  if (!(await refreshStateDept(bundle.country.isoCode))) return null;
  return fetchCountryBundle(bundle.country.isoCode, passportIso);
}

async function fetchCountryRow(isoCode: string, passportIso: string): Promise<Row | null> {
  const { data, error } = await supabase()
    .from("countries")
    .select(COUNTRY_SELECT)
    .eq("iso_code", isoCode)
    // countries.id is the ISO code (migration 007).
    .eq("visa_requirements.nationality_country_id", passportIso)
    .limit(1, { referencedTable: "words" })
    .maybeSingle();
  if (error) throw error;
  return data as Row | null;
}

function isStateDeptStale(bundle: CountryBundle, passportIso: string): boolean {
  const cutoff = Date.now() - STATE_DEPT_STALE_AFTER_DAYS * 86_400_000;
  const isStale = (iso: string | null | undefined) => {
    const t = iso ? Date.parse(iso) : NaN;
    return Number.isNaN(t) || t < cutoff;
  };
  const us = bundle.advisories.find((a) => a.issuingAuthority === "US State Department");
  if (isStale(us?.lastVerifiedAt)) return true;
  return bundle.country.isoCode !== passportIso && isStale(bundle.visa?.lastVerifiedAt);
}

async function refreshStateDept(isoCode: string): Promise<boolean> {
  try {
    const { data, error } = await supabase().functions.invoke(
      `refresh-country-state-dept?iso=${encodeURIComponent(isoCode)}`,
      { method: "GET" },
    );
    if (error) throw error;
    return data?.refreshed === true;
  } catch (e) {
    console.warn(`State Dept refresh failed for ${isoCode}:`, e);
    return false;
  }
}

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

function toBundle(row: Row, passportIso: string): CountryBundle {
  return {
    country: {
      id: row.id as string,
      isoCode: row.iso_code as string,
      nameCommon: row.name_common as string,
      nameOfficial: str(row.name_official) ?? (row.name_common as string),
      contentStatus: (str(row.content_status) as CountryBundle["country"]["contentStatus"]) ?? "none",
    },
    facts: toFacts(row.country_facts as Row | null, rows(row.country_languages)),
    cities: rows(row.cities).map(toCity),
    guide: toGuide(row.country_guides as Row | null),
    words: rows(row.words).map(toWord),
    advisories: rows(row.travel_advisories).map(toAdvisory),
    visa: toVisa(rows(row.visa_requirements), passportIso),
    fetchedAt: new Date().toISOString(),
  };
}

function toFacts(row: Row | null, languageRows: Row[]): CountryFacts {
  // All languages shown; only verified rows carry a figure.
  const languages = languageRows.map(toLanguage);
  return {
    capital: str(row?.capital),
    population: num(row?.population),
    currencyCode: str(row?.currency_code),
    currencyName: str(row?.currency_name),
    callingCode: str(row?.calling_code),
    languages,
    latitude: num(row?.latitude),
    longitude: num(row?.longitude),
    timezone: str(row?.timezone),
    lastImportedAt: str(row?.last_imported_at),
    borderingCountryCodes: row ? ((row.neighbors as string[] | null) ?? []) : null,
    climates: row ? ((row.climates as CountryFacts["climates"] | null) ?? []) : [],
    nativeNames: (row?.native_names as Record<string, string> | null) ?? {},
  };
}

function toLanguage(row: Row): LanguageEntry {
  return {
    name: (row.languages as Row).name as string,
    isOfficial: (row.is_official as boolean | null) ?? true,
    percentSpeakers: row.percent_status === "verified" ? num(row.percent_speakers) : null,
    usageNote: str(row.usage_note),
    displayRank: num(row.display_rank),
    source: str(row.percent_speakers_source),
    sourceUrl: str(row.percent_source_url),
  };
}

function toCity(row: Row): City {
  return {
    id: row.id as string,
    name: row.name as string,
    population: num(row.population),
    latitude: num(row.latitude),
    longitude: num(row.longitude),
    isFeatured: (row.is_featured as boolean | null) ?? false,
  };
}

const CROWD_LEVELS: CrowdLevel[] = ["low", "moderate", "high", "peak"];
const SEVERITIES: Severity[] = ["fyi", "important", "critical"];

function toGuide(row: Row | null): CountryGuide {
  if (!row) return { bestTimes: [], practicalNorms: [], lastReviewedAt: null };
  return {
    bestTimes: rows(row.best_times).map(
      (e): BestTime => ({
        months: e.months as string,
        whyShort: str(e.why_short) ?? "",
        why: str(e.why) ?? "",
        crowdLevel: CROWD_LEVELS.includes(e.crowd_level as CrowdLevel)
          ? (e.crowd_level as CrowdLevel)
          : "moderate",
      }),
    ),
    practicalNorms: rows(row.practical_norms).map(
      (e): NormItem => ({
        type: e.type as string,
        title: e.title as string,
        body: e.body as string,
        severity: SEVERITIES.includes(e.severity as Severity) ? (e.severity as Severity) : "fyi",
      }),
    ),
    lastReviewedAt: str(row.last_reviewed_at),
  };
}

function toAdvisory(row: Row): TravelAdvisory {
  return {
    issuingAuthority: row.issuing_authority as string,
    level: row.level == null ? null : String(row.level),
    levelLabel: str(row.level_label),
    summary: str(row.summary),
    officialUrl: row.official_url as string,
    issuedAt: str(row.issued_at),
    lastVerifiedAt: row.last_verified_at as string,
  };
}

// Embed is pre-filtered to passportIso; at most one row.
function toVisa(visaRows: Row[], passportIso: string): VisaInfo | null {
  const row = visaRows[0];
  // Unverified placeholder rows count as no data.
  if (!row || row.last_verified_at == null) return null;
  return {
    issuingAuthority: str(row.issuing_authority) ?? "US State Department",
    summary: row.summary as string,
    officialUrl: row.official_url as string,
    applicationUrl: str(row.application_url),
    lastVerifiedAt: row.last_verified_at as string,
    nationalityIsoCode: passportIso,
    prohibitedOnEntry: str(row.prohibited_on_entry),
    prohibitedOnExit: str(row.prohibited_on_exit),
  };
}

function toWord(row: Row): Word {
  return {
    id: row.id as string,
    lemma: row.lemma as string,
    translation: row.translation as string,
    partOfSpeech: str(row.part_of_speech),
    gender: str(row.gender),
    pronunciation: str(row.pronunciation),
    ipa: str(row.ipa),
    usageNote: str(row.usage_note),
    difficulty: num(row.difficulty),
  };
}
