import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listCountries } from "@/lib/countryRepository";
import { features } from "@/lib/features";
import { allPostcardColors } from "@/lib/flagPalette";
import { AccountPanel } from "@/components/AccountsGate";

export const metadata: Metadata = { title: "Account · whereabout" };

export default async function Account() {
  if (!features.accounts) notFound();
  const countries = await listCountries();
  const postcardColors = await allPostcardColors(countries.map((c) => c.isoCode));
  return <AccountPanel countries={countries} postcardColors={postcardColors} />;
}
