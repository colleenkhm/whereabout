import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { listCountries } from "@/lib/countryRepository";
import { features } from "@/lib/features";
import styles from "../contribute/Contribute.module.css";
import { AccountPanel } from "@/components/AccountsGate";

export const metadata: Metadata = { title: "Account · whereabout" };

export default async function Account() {
  if (!features.accounts) notFound();
  const countries = await listCountries();
  return (
    <PaperTexture color="var(--ocean)">
      <SiteHeader />
      <main className={styles.main}>
        <div className="tk-eyebrow ink-soft">ACCOUNT</div>
        <h1 className={styles.title}>Your whereabout</h1>
        <AccountPanel countries={countries} />
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}
