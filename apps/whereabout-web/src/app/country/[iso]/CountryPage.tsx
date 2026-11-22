"use client";

import { useEffect, useState } from "react";
import { paletteCycle, type SectionPalette } from "@/lib/color";
import { refreshIfStale } from "@/lib/countryRepository";
import { fetchRate } from "@/lib/currency";
import type { CountryBundle, CountrySummary, ExchangeRate } from "@/lib/types";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AccordionSection from "@/components/country/AccordionSection";
import AdditionalResourcesSection from "@/components/country/AdditionalResourcesSection";
import BestTimesSection from "@/components/country/BestTimesSection";
import BorderCountriesSection from "@/components/country/BorderCountriesSection";
import CitiesSection from "@/components/country/CitiesSection";
import CountryHeader from "@/components/country/CountryHeader";
import LanguageSection from "@/components/country/LanguageSection";
import MapSection from "@/components/country/MapSection";
import PracticalNormsSection from "@/components/country/PracticalNormsSection";
import TravelAdvisorySection from "@/components/country/TravelAdvisorySection";
import VisaSection from "@/components/country/VisaSection";

// Accordion row order.
const SECTIONS = ["visa", "cities", "map", "borders", "times", "advisory", "language", "norms", "resources"] as const;
type Section = (typeof SECTIONS)[number];

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
  const [open, setOpen] = useState<Set<Section>>(new Set());
  const { country, facts, guide, visa } = bundle;

  useEffect(() => {
    refreshIfStale(initial).then((fresh) => fresh && setBundle(fresh));
  }, [initial]);

  useEffect(() => {
    if (facts.currencyCode) fetchRate(facts.currencyCode).then(setRate);
  }, [facts.currencyCode]);

  const allExpanded = open.size === SECTIONS.length;
  const toggle = (s: Section) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(s)) next.add(s);
      return next;
    });
  const section = (s: Section) => ({ expanded: open.has(s), onToggle: () => toggle(s) });

  // US State Dept only for now.
  const usAdvisories = bundle.advisories.filter((a) => a.issuingAuthority === "US State Department");
  const borders = facts.borderingCountryCodes;

  return (
    <PaperTexture>
      <SiteHeader background={palette.header.tint} />
      <main style={{ "--section-ring": palette.stub.tint } as React.CSSProperties}>
        <CountryHeader
          isoCode={country.isoCode}
          name={country.nameCommon}
          timezone={facts.timezone}
          latitude={facts.latitude}
          exchangeRate={rate}
          currencyName={facts.currencyName}
          allExpanded={allExpanded}
          onToggleAll={() => setOpen(allExpanded ? new Set() : new Set(SECTIONS))}
          header={palette.header}
          stub={palette.stub}
        />

        <AccordionSection title="Visa & Entry" colors={palette.visa} hasData {...section("visa")}>
          <VisaSection visa={visa} accent={palette.visa.accentOnWhite} stateDeptUrl={usAdvisories[0]?.officialUrl ?? null} />
        </AccordionSection>

        <AccordionSection title="Cities" colors={palette.cities} hasData={bundle.cities.length > 0} {...section("cities")}>
          <CitiesSection cities={bundle.cities} capital={facts.capital} accent={palette.cities.accentOnWhite} />
        </AccordionSection>

        <AccordionSection title="Map" colors={palette.map} hasData={facts.latitude != null && facts.longitude != null} {...section("map")}>
          <MapSection
            latitude={facts.latitude!}
            longitude={facts.longitude!}
            cities={bundle.cities}
            capital={facts.capital}
            accent={palette.map.accentOnWhite}
          />
        </AccordionSection>

        <AccordionSection title="Border Countries" colors={palette.borderCountries} hasData={borders != null} {...section("borders")}>
          <BorderCountriesSection
            isoCode={country.isoCode}
            codes={borders ?? []}
            allCountries={allCountries}
            accent={palette.borderCountries.accentOnWhite}
          />
        </AccordionSection>

        <AccordionSection title="When to Visit" colors={palette.times} hasData={guide.bestTimes.length > 0} {...section("times")}>
          <BestTimesSection bestTimes={guide.bestTimes} palette={paletteCycle(palette)} />
        </AccordionSection>

        <AccordionSection title="Travel Advisory" colors={palette.advisory} hasData={usAdvisories.length > 0} {...section("advisory")}>
          <TravelAdvisorySection advisories={usAdvisories} accent={palette.advisory.accentOnWhite} />
        </AccordionSection>

        <AccordionSection title="Languages" colors={palette.language} hasData={facts.languages.length > 0} {...section("language")}>
          <LanguageSection languages={facts.languages} isoCode={country.isoCode} colors={palette.language} />
        </AccordionSection>

        <AccordionSection title="Practical Norms" colors={palette.norms} hasData={guide.practicalNorms.length > 0} {...section("norms")}>
          <PracticalNormsSection norms={guide.practicalNorms} colors={palette.norms} />
        </AccordionSection>

        <AccordionSection title="Additional Resources" colors={palette.resources} hasData {...section("resources")}>
          <AdditionalResourcesSection accent={palette.resources.accentOnWhite} />
        </AccordionSection>
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}
