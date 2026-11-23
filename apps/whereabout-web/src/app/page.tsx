import { listCountries } from "@/lib/countryRepository";
import PaperTexture from "@/components/PaperTexture";
import BetaTag from "@/components/BetaTag";
import ContributeLink from "@/components/ContributeLink";
import SiteFooter from "@/components/SiteFooter";
import CountrySearch from "./CountrySearch";
import FlagBackdrop from "./FlagBackdrop";
import styles from "./Home.module.css";

// No site header here: just flags and the search.
export default async function Home() {
  const countries = await listCountries();
  return (
    <PaperTexture color="var(--ocean)">
      <div className={styles.stage}>
        <FlagBackdrop countries={countries} />
        <div className={`${styles.corner} ${styles.left}`}>
          <BetaTag variant="filled" />
        </div>
        {/* Ink tag over the flags, so it reads on any flag. */}
        <div className={`${styles.corner} ${styles.right}`}>
          <ContributeLink variant="filled" />
        </div>
        <main className={styles.main}>
          <div className={styles.search}>
            <CountrySearch countries={countries} />
          </div>
        </main>
        <SiteFooter onFlags />
      </div>
    </PaperTexture>
  );
}
