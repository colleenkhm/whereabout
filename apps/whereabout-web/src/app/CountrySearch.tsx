"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";
import type { CountrySummary } from "@/lib/types";
import styles from "./CountrySearch.module.css";

// Accent-insensitive, so "aland" finds "Åland Islands".
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function CountrySearch({ countries }: { countries: CountrySummary[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = fold(query.trim());
    return q ? countries.filter((c) => fold(c.nameCommon).startsWith(q)) : [];
  }, [countries, query]);
  const open = query.trim() !== "";

  return (
    <div className={`${styles.search} ${open ? styles.isOpen : ""}`}>
      <label className={styles.field}>
        <MdSearch size={24} className={styles.icon} aria-hidden />
        <input
          type="search"
          placeholder="Where to?"
          aria-label="Search countries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
        />
      </label>

      {open && (
        <ul className={styles.list}>
          {results.length > 0 ? (
            results.map((c) => (
              <li key={c.isoCode}>
                <Link href={`/country/${c.isoCode.toLowerCase()}`} className={styles.row}>
                  <span className={styles.code}>{c.isoCode}</span>
                  <span className={styles.name}>{c.nameCommon}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className={styles.none}>No countries match “{query.trim()}”</li>
          )}
        </ul>
      )}
    </div>
  );
}
