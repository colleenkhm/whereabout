"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MdChevronRight, MdSearch } from "react-icons/md";
import type { CountrySummary } from "@/lib/types";
import styles from "./CountrySearch.module.css";

// Accent-insensitive, so "aland" finds "Åland Islands".
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Keeps the logo where it sat with the old 56/24 spacing.
const LOGO_LIFT = (88 - 56 + 36 - 24) / 2;

export default function CountrySearch({ countries }: { countries: CountrySummary[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = fold(query.trim());
    return q ? countries.filter((c) => fold(c.nameCommon).startsWith(q)) : [];
  }, [countries, query]);

  return (
    <>
      <label className={styles.field}>
        <MdSearch size={24} className={styles.icon} aria-hidden />
        <input
          type="search"
          placeholder="Search countries"
          aria-label="Search countries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
        />
      </label>

      {results.length > 0 ? (
        <ul className={styles.list}>
          {results.map((c) => (
            <li key={c.isoCode} className={styles.item}>
              <Link href={`/country/${c.isoCode.toLowerCase()}`} className={`row-title ${styles.row}`}>
                {c.nameCommon}
                <MdChevronRight size={24} color="var(--logo-green)" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.logo} style={{ transform: `translateY(-${LOGO_LIFT}px)` }}>
          <Image src="/whereabout.png" alt="whereabout logo" width={220} height={220} priority />
        </div>
      )}
    </>
  );
}
