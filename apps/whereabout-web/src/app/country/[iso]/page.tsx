import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fallbackPalette, paletteFromFlagColors } from "@/lib/color";
import { fetchCountryBundle, listCountries } from "@/lib/countryRepository";
import { extractFlagBaseColors } from "@/lib/flagPalette";
import CountryPage from "./CountryPage";

type Params = { params: Promise<{ iso: string }> };

export const dynamicParams = false;

// One fetch each per build, shared by metadata and page.
const getBundle = cache((iso: string) => fetchCountryBundle(iso.toUpperCase()));
const getCountries = cache(listCountries);

export async function generateStaticParams() {
  const countries = await getCountries();
  return countries.map((c) => ({ iso: c.isoCode.toLowerCase() }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { iso } = await params;
  const bundle = await getBundle(iso);
  return { title: bundle ? `${bundle.country.nameCommon} · whereabout` : "whereabout" };
}

export default async function Page({ params }: Params) {
  const { iso } = await params;
  const [bundle, countries, flagColors] = await Promise.all([
    getBundle(iso),
    getCountries(),
    extractFlagBaseColors(iso),
  ]);
  if (!bundle) notFound();
  const palette = flagColors?.length ? paletteFromFlagColors(flagColors) : fallbackPalette;
  return <CountryPage initial={bundle} palette={palette} allCountries={countries} />;
}
