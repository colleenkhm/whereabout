import { listCountries } from "@/lib/countryRepository";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import CountrySearch from "./CountrySearch";
import StampBackdrop from "./StampBackdrop";

// No site header here: just stamps and the search.
export default async function Home() {
  const countries = await listCountries();
  return (
    <PaperTexture color="var(--ocean)">
      <main
        style={{
          flex: 1,
          position: "relative",
          display: "grid",
          placeItems: "center",
          padding: "48px 24px",
          minHeight: "max(560px, 100svh)",
        }}
      >
        <StampBackdrop countries={countries} />
        <div style={{ position: "relative", width: "100%", maxWidth: 640 }}>
          <CountrySearch countries={countries} />
        </div>
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}
