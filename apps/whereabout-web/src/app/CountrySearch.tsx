"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";
import { contributeHref } from "@/lib/contribute";
import type { CountrySummary } from "@/lib/types";
import styles from "./CountrySearch.module.css";

// Accent-insensitive, so "aland" finds "Åland Islands".
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// contribute: results open the add/dispute version of the country page, and the panel stays white (it sits in a white card). Home is the ink variant.
// onSelect: results pick a country instead of navigating (white panel too).
export default function CountrySearch({
  countries,
  contribute = false,
  onSelect,
}: {
  countries: CountrySummary[];
  contribute?: boolean;
  onSelect?: (country: CountrySummary) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = fold(query.trim());
    return q ? countries.filter((c) => fold(c.nameCommon).startsWith(q)) : [];
  }, [countries, query]);
  const open = query.trim() !== "";

  return (
    <div className={`${styles.search} ${open ? styles.isOpen : ""} ${contribute || onSelect ? "" : styles.dark}`}>
      <label className={styles.field}>
        <MdSearch size={24} className={styles.icon} aria-hidden />
        <input
          type="search"
          placeholder={onSelect ? "Add a place" : contribute ? "Which country?" : "Where to?"}
          aria-label="Search countries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
        />
      </label>

      {open && (
        <ul className={styles.list}>
          {results.length > 0 ? (
            results.map((c) => {
              const row = (
                <>
                  <span className={styles.code}>{c.isoCode}</span>
                  <span className={styles.name}>{c.nameCommon}</span>
                </>
              );
              return (
                <li key={c.isoCode}>
                  {/* Full load into contribute mode, which is read from the URL on mount. */}
                  {onSelect ? (
                    <button
                      type="button"
                      className={`${styles.row} ${styles.pick}`}
                      onClick={() => {
                        onSelect(c);
                        setQuery("");
                      }}
                    >
                      {row}
                    </button>
                  ) : contribute ? (
                    <a href={contributeHref(c.isoCode)} className={styles.row}>
                      {row}
                    </a>
                  ) : (
                    <Link href={`/country/${c.isoCode.toLowerCase()}`} className={styles.row}>
                      {row}
                    </Link>
                  )}
                </li>
              );
            })
          ) : (
            <li className={styles.none}>No countries match “{query.trim()}”</li>
          )}
        </ul>
      )}
    </div>
  );
}
