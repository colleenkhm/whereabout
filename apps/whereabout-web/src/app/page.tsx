import { listCountries } from "@/lib/countryRepository";
import PaperTexture from "@/components/PaperTexture";
import ContributeLink from "@/components/ContributeLink";
import SiteFooter from "@/components/SiteFooter";
import CountrySearch from "./CountrySearch";
import StampBackdrop from "./StampBackdrop";

// No site header here: just stamps and the search.
export default async function Home() {
  const countries = await listCountries();
  return (
    <PaperTexture color="var(--ocean)">
      {/* Backdrop spans the footer too. */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <StampBackdrop countries={countries} />
        {/* Ink tag over the stamps, so it reads on any flag. */}
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}>
          <ContributeLink variant="filled" />
        </div>
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
          <div style={{ position: "relative", width: "100%", maxWidth: 580 }}>
            <CountrySearch countries={countries} />
          </div>
        </main>
        <SiteFooter />
      </div>
    </PaperTexture>
  );
}
