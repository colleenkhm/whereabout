import type { Metadata } from "next";
import ExternalLink from "@/components/ExternalLink";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Sources & credits · whereabout" };

// Wording required by each source's license/terms.
type Credit = { name: string; usedFor: string; notice: string; links: [string, string][] };

const CC: [string, string] = ["CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"];

const CREDITS: Credit[] = [
  {
    name: "mledoze/countries",
    usedFor: "Capitals, currencies, calling codes, borders",
    notice:
      "Contains information from mledoze/countries, which is made available under the Open Database License (ODbL). Our adapted country facts are free to download under the ODbL too.",
    links: [
      ["mledoze/countries", "https://github.com/mledoze/countries"],
      ["ODbL", "https://opendatacommons.org/licenses/odbl/1-0/"],
      ["Download CSV", "/data/country-facts.csv"],
      ["Data license", "/data/country-facts-license.txt"],
    ],
  },
  {
    name: "GeoNames",
    usedFor: "Cities, map pins and time zones",
    notice: "Data from GeoNames, licensed under CC BY 4.0.",
    links: [["geonames.org", "https://www.geonames.org/"], CC],
  },
  {
    name: "OpenStreetMap",
    usedFor: "Map tiles",
    notice: "Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).",
    links: [
      ["openstreetmap.org", "https://www.openstreetmap.org/copyright"],
      ["ODbL", "https://opendatacommons.org/licenses/odbl/1-0/"],
    ],
  },
  {
    name: "World Bank",
    usedFor: "Population (World Development Indicators)",
    notice: "Data from World Bank Open Data, licensed under CC BY 4.0.",
    links: [["data.worldbank.org", "https://data.worldbank.org/"], CC],
  },
  {
    name: "U.S. Department of State",
    usedFor: "Travel advisories, visa and entry requirements",
    notice: "Public domain. Not affiliated with or endorsed by the U.S. Department of State.",
    links: [["travel.state.gov", "https://travel.state.gov/"]],
  },
  {
    name: "ExchangeRate-API",
    usedFor: "Currency rates",
    notice: "Approximate, updated daily. Not for financial transactions.",
    links: [["exchangerate-api.com", "https://www.exchangerate-api.com/"]],
  },
  {
    name: "National censuses and surveys",
    usedFor: "Language speaker percentages",
    notice:
      "Figures from each country's statistics office or survey (including Eurobarometer, Morocco's HCP, CC BY 4.0, Insee and the French culture ministry's DEPS, Licence Ouverte 2.0, Kyrgyzstan's National Statistical Committee, CC BY-NC-SA 4.0, and the ABS and Stats NZ, CC BY 4.0), linked under each country's Languages card. Percentages are calculated from the published tables. Percentages derived from Kyrgyzstan's figures are shared under CC BY-NC-SA 4.0. Contains public sector information licensed under the Open Government Licence v3.0 (ONS, NISRA). Gibraltar census figures © Crown Copyright, HM Government of Gibraltar.",
    links: [
      CC,
      ["CC BY-NC-SA 4.0", "https://creativecommons.org/licenses/by-nc-sa/4.0/"],
      ["OGL v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"],
    ],
  },
  {
    name: "Flagpedia",
    usedFor: "Flag images",
    notice: "Public-domain flags served via flagcdn.com.",
    links: [["flagpedia.net", "https://flagpedia.net/"]],
  },
];

export default function About() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 0" }}>
        <h1 className="page-heading" style={{ fontSize: 26 }}>
          Sources &amp; credits
        </h1>
        <p className="s-body" style={{ marginTop: 8 }}>
          Travel tips, norms and language notes are written by hand. The facts below come from these open data sources.
        </p>
        <div style={{ marginTop: 16, background: "var(--white)", borderRadius: "var(--card-radius)", boxShadow: "var(--card-shadow)" }}>
          {CREDITS.map((c, i) => (
            <div key={c.name} style={{ padding: "14px 16px", borderBottom: i < CREDITS.length - 1 ? "1px solid var(--rule)" : "none" }}>
              <div className="row-title">{c.name}</div>
              <div className="s-label" style={{ marginTop: 2 }}>
                {c.usedFor.toUpperCase()}
              </div>
              <p className="s-body" style={{ marginTop: 6, fontSize: 14 }}>
                {c.notice}
              </p>
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                {c.links.map(([label, url]) => (
                  <ExternalLink key={url} label={label} url={url} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
