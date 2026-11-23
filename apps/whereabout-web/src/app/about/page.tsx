import type { Metadata } from "next";
import Link from "next/link";
import ExternalLink from "@/components/ExternalLink";
import PaperTexture from "@/components/PaperTexture";
import SerratedSticker from "@/components/SerratedSticker";
import SiteHeader from "@/components/SiteHeader";
import styles from "./About.module.css";

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
    <PaperTexture>
      <SiteHeader />
      <main>
        <div className={styles.masthead}>
          {/* Beta note as an ink sticker; beside the title on desktop. */}
          <div className={styles.inner}>
            <div>
              <div className="tk-eyebrow ink-soft">
                ABOUT
              </div>
              <h1 className={styles.title}>Sources &amp; credits</h1>
              <p className={`s-body ${styles.intro}`}>
                Travel tips, norms and language notes are written by hand. The facts on this site come from these open
                data sources listed below.
              </p>
            </div>
            <div>
              <SerratedSticker className={`s-body ${styles.sticker}`}>
                <strong>whereabout</strong> is in beta. Information is still being collected and checked, so some countries are thinner
                than others. If something is missing or wrong, head to <Link href="/contribute" className={styles.inlineLink}>
                  Get involved
                </Link> to add or dispute information.
              </SerratedSticker>
            </div>
          </div>
        </div>
        <div className={styles.wrap}>
          {CREDITS.map((c) => {
            return (
              <section key={c.name} className={styles.card}>
                <span className={styles.pin} aria-hidden />
                <div className={styles.head}>
                  <h2 className="sec-name">{c.name}</h2>
                  <div className={`tk-eyebrow ${styles.usedFor}`}>
                    {c.usedFor.toUpperCase()}
                  </div>
                </div>
                <div className={styles.body}>
                  <p className={`s-body ${styles.small}`}>
                    {c.notice}
                  </p>
                  <div className={styles.links}>
                    {c.links.map(([label, url]) => (
                      <ExternalLink key={url} label={label} url={url} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        <div className={styles.byline}>
          <div className="tf-label ink-soft">
            BUILT BY
          </div>
          <div className={`s-body ${styles.small} ${styles.builder}`}>
            Colleen Murray
          </div>
        </div>
      </main>
    </PaperTexture>
  );
}
