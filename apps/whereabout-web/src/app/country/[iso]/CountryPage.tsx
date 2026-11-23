"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdLink,
  MdLocationCity,
  MdOutlineChatBubbleOutline,
  MdOutlineBadge,
  MdOutlineExplore,
  MdOutlineMap,
  MdOutlineSchedule,
  MdOutlineShield,
  MdOutlineTipsAndUpdates,
  MdOutlineWbSunny,
} from "react-icons/md";
import { type SectionColors, type SectionPalette, type TicketColors } from "@/lib/color";
import { CONTRIBUTE_SECTIONS, OTHER_SECTION, useContributeMode } from "@/lib/contribute";
import { refreshIfStale } from "@/lib/countryRepository";
import { fetchRate } from "@/lib/currency";
import type { CountryBundle, CountrySummary, ExchangeRate } from "@/lib/types";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import AdditionalResourcesSection from "@/components/country/AdditionalResourcesSection";
import BestTimesSection from "@/components/country/BestTimesSection";
import BorderCountriesSection from "@/components/country/BorderCountriesSection";
import CitiesSection from "@/components/country/CitiesSection";
import ContributeForm from "@/components/country/ContributeForm";
import CountryHeader from "@/components/country/CountryHeader";
import { LocalDetails } from "@/components/country/LocalFacts";
import LanguageSection from "@/components/country/LanguageSection";
import TalkingIcon from "@/components/icons/TalkingIcon";
import MapSection from "@/components/country/MapSection";
import PostageCard, { type CardShape, POSTAGE_TILTS, PostageGrid } from "@/components/country/PostageCard";
import PostageSheet, { type SheetContent } from "@/components/country/PostageSheet";
import PracticalNormsSection from "@/components/country/PracticalNormsSection";
import TravelAdvisorySection from "@/components/country/TravelAdvisorySection";
import VisaSection from "@/components/country/VisaSection";

// sheet: what the card opens.
interface CardSpec {
  title: string;
  icon: IconType;
  shape: CardShape;
  hasData: boolean;
  sheet: (c: SectionColors) => React.ReactNode;
}

export default function CountryPage({
  initial,
  palette,
  allCountries,
}: {
  initial: CountryBundle;
  palette: SectionPalette;
  allCountries: CountrySummary[];
}) {
  const [bundle, setBundle] = useState(initial);
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [sheet, setSheet] = useState<SheetContent | null>(null);
  const columns = useGridColumns();
  const contribute = useContributeMode();
  const { country, facts, guide, visa } = bundle;

  useEffect(() => {
    refreshIfStale(initial).then((fresh) => fresh && setBundle(fresh));
  }, [initial]);

  useEffect(() => {
    if (facts.currencyCode && !contribute) fetchRate(facts.currencyCode).then(setRate);
  }, [facts.currencyCode, contribute]);

  // US State Dept only for now.
  const usAdvisories = bundle.advisories.filter((a) => a.issuingAuthority === "US State Department");
  const advisory = usAdvisories[0];
  const borders = facts.borderingCountryCodes;
  const hasCoords = facts.latitude != null && facts.longitude != null;

  const specs: CardSpec[] = [
    {
      title: "Visa & Entry",
      shape: "ticket",
      icon: MdOutlineBadge,
      hasData: true,
      sheet: (c) => <VisaSection visa={visa} accent={c.accentOnWhite} stateDeptUrl={advisory?.officialUrl ?? null} />,
    },
    {
      title: "Cities",
      shape: "skyline",
      icon: MdLocationCity,
      hasData: bundle.cities.length > 0,
      sheet: (c) => <CitiesSection cities={bundle.cities} capital={facts.capital} accent={c.accentOnWhite} />,
    },
    {
      title: "Map",
      shape: "foldedMap",
      icon: MdOutlineExplore,
      hasData: hasCoords,
      sheet: (c) => (
        <MapSection
          latitude={facts.latitude!}
          longitude={facts.longitude!}
          cities={bundle.cities}
          capital={facts.capital}
          accent={c.accentOnWhite}
        />
      ),
    },
    {
      title: "Languages",
      shape: "speech",
      icon: TalkingIcon,
      hasData: facts.languages.length > 0,
      sheet: (c) => <LanguageSection languages={facts.languages} isoCode={country.isoCode} colors={c} />,
    },
    {
      title: "Border Countries",
      shape: "globe",
      icon: MdOutlineMap,
      hasData: borders != null,
      sheet: (c) => (
        <BorderCountriesSection isoCode={country.isoCode} codes={borders ?? []} allCountries={allCountries} accent={c.accentOnWhite} />
      ),
    },
    {
      title: "Travel Advisory",
      shape: "clipboard",
      icon: MdOutlineShield,
      hasData: advisory != null,
      sheet: (c) => <TravelAdvisorySection advisories={usAdvisories} accent={c.accentOnWhite} />,
    },
    {
      title: "Practical Norms",
      shape: "postIt",
      icon: MdOutlineTipsAndUpdates,
      hasData: guide.practicalNorms.length > 0,
      sheet: (c) => <PracticalNormsSection norms={guide.practicalNorms} colors={c} />,
    },
    {
      title: "When to Visit",
      shape: "calendar",
      icon: MdOutlineWbSunny,
      hasData: guide.bestTimes.length > 0,
      sheet: () => <BestTimesSection bestTimes={guide.bestTimes} palette={palette.tickets.map((t) => t.body)} />,
    },
    {
      title: "Resources",
      shape: "lined",
      icon: MdLink,
      hasData: true,
      sheet: (c) => <AdditionalResourcesSection accent={c.accentOnWhite} />,
    },
    // Contribute mode only; the form is its only sheet.
    ...(contribute ? [{ title: OTHER_SECTION, icon: MdOutlineChatBubbleOutline, shape: "indexCard" as const, hasData: true, sheet: () => null }] : []),
  ];

  return (
    <PaperTexture color={palette.page.tint} deep={palette.pageDeep}>
      <CountryHeader
        isoCode={country.isoCode}
        name={country.nameCommon}
        languages={facts.languages}
        nativeNames={facts.nativeNames}
        // Contribute mode: name and stamp only.
        timezone={contribute ? null : facts.timezone}
        latitude={contribute ? null : facts.latitude}
        exchangeRate={rate}
        currencyName={facts.currencyName}
        currencyCode={contribute ? null : facts.currencyCode}
        header={palette.header}
        nav={palette.nav}
        onOpenDetails={() =>
          setSheet({
            title: "Local time & money",
            icon: MdOutlineSchedule,
            colors: INK_HEAD,
            body: (
              <LocalDetails
                timezone={facts.timezone}
                exchangeRate={rate}
                currencyName={facts.currencyName}
                currencyCode={facts.currencyCode}
                accent={palette.header.accentOnWhite}
              />
            ),
          })
        }
      />
      <main>
        {contribute && <ContributeBanner isoCode={country.isoCode} name={country.nameCommon} />}
        <PostageGrid page={palette.page} contribute={contribute}>
          {/* Contribute mode: only contributable tickets (no Map). */}
          {specs.filter((spec) => !contribute || spec.title in CONTRIBUTE_SECTIONS).map((spec, i) => {
            const colors = ticketColor(palette.tickets, i, columns);
            // Contribute mode: add cards always open; dispute cards need something to dispute.
            const kind = contribute ? CONTRIBUTE_SECTIONS[spec.title] : undefined;
            const enabled = contribute ? kind === "add" || (kind === "dispute" && spec.hasData) : spec.hasData;
            // Contribute: header in the ticket's stamp color as a flow reminder. Else the stub's.
            const head = kind && spec.title !== OTHER_SECTION ? STAMP_COLORS[kind] : colors.stub;
            const open = () =>
              setSheet(
                kind
                  ? {
                      title: spec.title === OTHER_SECTION ? spec.title : `${kind === "add" ? "Add" : "Dispute"}: ${spec.title}`,
                      icon: spec.icon,
                      colors: head,
                      body: (
                        <ContributeForm
                          key={spec.title}
                          kind={kind}
                          section={spec.title}
                          countryIso={country.isoCode}
                          countryName={country.nameCommon}
                          cities={spec.title === "Cities" ? bundle.cities : undefined}
                          capital={facts.capital}
                          current={kind === "dispute" ? spec.sheet(colors.body) : undefined}
                          colors={head}
                          onDone={() => setSheet(null)}
                        />
                      ),
                    }
                  : { title: spec.title, icon: spec.icon, colors: head, body: spec.sheet(colors.body) },
              );
            return (
              <PostageCard
                key={spec.title}
                title={spec.title}
                icon={spec.icon}
                shape={spec.shape}
                colors={colors}
                hasData={enabled}
                mark={contribute ? (spec.title === OTHER_SECTION ? "none" : (kind ?? "none")) : undefined}
                tilt={POSTAGE_TILTS[i % POSTAGE_TILTS.length]}
                onOpen={open}
              />
            );
          })}
        </PostageGrid>
      </main>
      <SiteFooter />
      <PostageSheet sheet={sheet} onClose={() => setSheet(null)} />
    </PaperTexture>
  );
}

// Details sheet header matches the ink departures bar.
const INK_HEAD: SectionColors = { tint: "#1a1520", textColor: "#ffffff", accentOnWhite: "#1a1520" };

// Match the tickets' ADD/DISPUTE stamps.
const stampColors = (v: string): SectionColors => ({ tint: v, textColor: "#ffffff", accentOnWhite: v });
const STAMP_COLORS = { add: stampColors("var(--stamp-add)"), dispute: stampColors("var(--stamp-dispute)") };

// Ink strip above the grid: which mode, and the way back out.
function ContributeBanner({ isoCode, name }: { isoCode: string; name: string }) {
  return (
    <div style={{ background: "var(--ink)", color: "var(--white)" }}>
      <div
        style={{
          maxWidth: "calc(var(--content-max) - 40px)",
          margin: "0 auto",
          padding: "10px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "4px 16px",
        }}
      >
        <span className="tk-eyebrow">CONTRIBUTING TO {name.toUpperCase()}</span>
        {/* Full load: mode is read from the URL on mount. */}
        <a href={`/country/${isoCode.toLowerCase()}`} className="tf-link" style={{ textDecoration: "underline" }}>
          DONE
        </a>
      </div>
    </div>
  );
}

// Matches PostageGrid's CSS breakpoint.
function useGridColumns(): number {
  const [columns, setColumns] = useState(2);
  useEffect(() => {
    const mid = window.matchMedia("(min-width: 600px)");
    const update = () => setColumns(mid.matches ? 3 : 2);
    update();
    mid.addEventListener("change", update);
    return () => mid.removeEventListener("change", update);
  }, []);
  return columns;
}

// Cycles flag colors; staggers rows so a cycle that divides the
// column count doesn't stack into solid columns.
function ticketColor(tickets: TicketColors[], i: number, columns: number): TicketColors {
  const n = tickets.length;
  const stagger = n > 1 && columns % n === 0;
  return tickets[(i + (stagger ? Math.floor(i / columns) : 0)) % n];
}
