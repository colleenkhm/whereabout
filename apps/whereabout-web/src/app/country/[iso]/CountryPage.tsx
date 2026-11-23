"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdLink,
  MdLocationCity,
  MdOutlineBadge,
  MdOutlineExplore,
  MdOutlineMap,
  MdOutlineShield,
  MdOutlineTipsAndUpdates,
  MdOutlineWbSunny,
  MdTranslate,
} from "react-icons/md";
import { type SectionColors, type SectionPalette, type TicketColors } from "@/lib/color";
import { refreshIfStale } from "@/lib/countryRepository";
import { fetchRate } from "@/lib/currency";
import type { CountryBundle, CountrySummary, ExchangeRate } from "@/lib/types";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AdditionalResourcesSection from "@/components/country/AdditionalResourcesSection";
import BestTimesSection from "@/components/country/BestTimesSection";
import BorderCountriesSection from "@/components/country/BorderCountriesSection";
import CitiesSection from "@/components/country/CitiesSection";
import CountryHeader from "@/components/country/CountryHeader";
import LanguageSection from "@/components/country/LanguageSection";
import MapSection from "@/components/country/MapSection";
import PostageCard, { POSTAGE_TILTS, PostageGrid } from "@/components/country/PostageCard";
import PostageSheet, { type SheetContent } from "@/components/country/PostageSheet";
import PracticalNormsSection from "@/components/country/PracticalNormsSection";
import TravelAdvisorySection from "@/components/country/TravelAdvisorySection";
import VisaSection from "@/components/country/VisaSection";

// sheet: what the card opens.
interface CardSpec {
  title: string;
  icon: IconType;
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
  const { country, facts, guide, visa } = bundle;

  useEffect(() => {
    refreshIfStale(initial).then((fresh) => fresh && setBundle(fresh));
  }, [initial]);

  useEffect(() => {
    if (facts.currencyCode) fetchRate(facts.currencyCode).then(setRate);
  }, [facts.currencyCode]);

  // US State Dept only for now.
  const usAdvisories = bundle.advisories.filter((a) => a.issuingAuthority === "US State Department");
  const advisory = usAdvisories[0];
  const borders = facts.borderingCountryCodes;
  const hasCoords = facts.latitude != null && facts.longitude != null;

  const specs: CardSpec[] = [
    {
      title: "Visa & Entry",
      icon: MdOutlineBadge,
      hasData: true,
      sheet: (c) => <VisaSection visa={visa} accent={c.accentOnWhite} stateDeptUrl={advisory?.officialUrl ?? null} />,
    },
    {
      title: "Cities",
      icon: MdLocationCity,
      hasData: bundle.cities.length > 0,
      sheet: (c) => <CitiesSection cities={bundle.cities} capital={facts.capital} accent={c.accentOnWhite} />,
    },
    {
      title: "Map",
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
      title: "Border Countries",
      icon: MdOutlineMap,
      hasData: borders != null,
      sheet: (c) => (
        <BorderCountriesSection isoCode={country.isoCode} codes={borders ?? []} allCountries={allCountries} accent={c.accentOnWhite} />
      ),
    },
    {
      title: "Languages",
      icon: MdTranslate,
      hasData: facts.languages.length > 0,
      sheet: (c) => <LanguageSection languages={facts.languages} isoCode={country.isoCode} colors={c} />,
    },
    {
      title: "Travel Advisory",
      icon: MdOutlineShield,
      hasData: advisory != null,
      sheet: (c) => <TravelAdvisorySection advisories={usAdvisories} accent={c.accentOnWhite} />,
    },
    {
      title: "Practical Norms",
      icon: MdOutlineTipsAndUpdates,
      hasData: guide.practicalNorms.length > 0,
      sheet: (c) => <PracticalNormsSection norms={guide.practicalNorms} colors={c} />,
    },
    {
      title: "When to Visit",
      icon: MdOutlineWbSunny,
      hasData: guide.bestTimes.length > 0,
      sheet: () => <BestTimesSection bestTimes={guide.bestTimes} palette={palette.tickets.map((t) => t.body)} />,
    },
    {
      title: "Resources",
      icon: MdLink,
      hasData: true,
      sheet: (c) => <AdditionalResourcesSection accent={c.accentOnWhite} />,
    },
  ];

  return (
    <PaperTexture>
      <SiteHeader background={palette.headerAccent} />
      <main>
        <CountryHeader
          isoCode={country.isoCode}
          name={country.nameCommon}
          languages={facts.languages}
          nativeNames={facts.nativeNames}
          timezone={facts.timezone}
          latitude={facts.latitude}
          exchangeRate={rate}
          currencyName={facts.currencyName}
          currencyCode={facts.currencyCode}
          header={palette.header}
          accent={palette.headerAccent}
        />
        <PostageGrid>
          {specs.map((spec, i) => {
            const colors = ticketColor(palette.tickets, i, columns);
            return (
              <PostageCard
                key={spec.title}
                title={spec.title}
                icon={spec.icon}
                colors={colors}
                hasData={spec.hasData}
                tilt={POSTAGE_TILTS[i % POSTAGE_TILTS.length]}
                onOpen={() => setSheet({ title: spec.title, icon: spec.icon, colors: colors.body, body: spec.sheet(colors.body) })}
              />
            );
          })}
        </PostageGrid>
      </main>
      <SiteFooter accent={palette.headerAccent} />
      <PostageSheet sheet={sheet} onClose={() => setSheet(null)} />
    </PaperTexture>
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
