import { listCountries } from "@/lib/countryRepository";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CountrySearch from "./CountrySearch";

export default async function Home() {
  const countries = await listCountries();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--logo-sky-pale)" }}>
      <SiteHeader background="var(--logo-green)" />
      <main style={{ flex: 1, width: "100%", maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
        <h1 className="page-heading" style={{ fontSize: 31, color: "var(--logo-green)", textAlign: "center", marginTop: 88 }}>
          Where to?
        </h1>
        <CountrySearch countries={countries} />
      </main>
      <SiteFooter />
    </div>
  );
}
