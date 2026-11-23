import type { Metadata } from "next";
import { MdOutlineEditNote } from "react-icons/md";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { listCountries } from "@/lib/countryRepository";
import CountrySearch from "../CountrySearch";
import styles from "./Contribute.module.css";

export const metadata: Metadata = { title: "Contribute · whereabout" };

export default async function Contribute() {
  const countries = await listCountries();
  return (
    <PaperTexture color="var(--ocean)">
      <SiteHeader />
      <main className={styles.main}>
        <div className="tk-eyebrow" style={{ color: "rgba(26, 21, 32, 0.6)" }}>
          CONTRIBUTE
        </div>
        <h1 className={styles.title}>Help fill in the map</h1>

        <section className={styles.option}>
          <div className={styles.head}>
            <MdOutlineEditNote size={24} aria-hidden />
            <h2 className="sec-name">Add or dispute country information</h2>
          </div>
          <div className={styles.body}>
            <p className="s-body">
              Know something a traveler should, or spotted something wrong? Pick a country and you&apos;ll see its page
              as usual, with each ticket marked <b>ADD</b> or <b>DISPUTE</b>.
            </p>
            <ul className={`s-body ${styles.list}`}>
              <li>
                <b>Add</b> to when to visit, practical norms, resources, and things to do, eat, or stay in a city.
              </li>
              <li>
                <b>Dispute</b> facts like visas, travel advisories, borders and languages. Tell us what&apos;s wrong and
                where you saw it.
              </li>
            </ul>
            <p className="src-row">Everything is checked by hand before a page changes.</p>
            <div className={styles.search}>
              <CountrySearch countries={countries} contribute />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}
