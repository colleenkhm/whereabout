import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listCountries } from "@/lib/countryRepository";
import { features } from "@/lib/features";
import { allPostcardColors } from "@/lib/flagPalette";
import { ProfilePage } from "@/components/AccountsGate";

export const metadata: Metadata = { title: "Traveler · whereabout", robots: { index: false } };

// Someone's profile, by ?u=<id>. Also the invite link.
export default async function Profile() {
  if (!features.accounts) notFound();
  const countries = await listCountries();
  const postcardColors = await allPostcardColors(countries.map((c) => c.isoCode));
  return <ProfilePage countries={countries} postcardColors={postcardColors} />;
}
