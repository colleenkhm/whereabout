"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdOutlinePublic } from "react-icons/md";
import { fetchAllMarks, MARK_KINDS, type MarkedCountry, type MarkKind } from "@/lib/countryMarks";
import styles from "../contribute/Contribute.module.css";
import own from "./Account.module.css";

const HEADINGS: Record<MarkKind, string> = { visited: "Visited", interested: "Interested" };

// Signed-in only: countries marked on their pages.
export default function MarkedCountries() {
  const [marks, setMarks] = useState<MarkedCountry[] | null | undefined>(undefined);
  useEffect(() => {
    fetchAllMarks().then(setMarks);
  }, []);

  return (
    <section className={styles.option}>
      <div className={styles.head}>
        <MdOutlinePublic size={22} aria-hidden />
        <h2 className="sec-name">Your countries</h2>
      </div>
      <div className={styles.body}>
        {marks === undefined ? (
          <p className="s-body">Loading…</p>
        ) : marks === null ? (
          <p className="s-body error-text" role="alert">
            Couldn&apos;t load your countries. Please refresh to try again.
          </p>
        ) : marks.length === 0 ? (
          <p className="s-body">
            Nothing marked yet. Tap <b>VISITED</b> or <b>INTERESTED</b> at the top of any country page.
          </p>
        ) : (
          MARK_KINDS.map((kind) => {
            const list = marks.filter((m) => m.kind === kind);
            return (
              <div key={kind}>
                <h3 className={`tk-eyebrow ${own.groupHead}`}>
                  {HEADINGS[kind]} · {list.length}
                </h3>
                {list.length === 0 ? (
                  <p className="src-row">None yet.</p>
                ) : (
                  <ul className={own.countries}>
                    {list.map((m) => (
                      <li key={m.isoCode}>
                        <Link href={`/country/${m.isoCode.toLowerCase()}`} className={`s-body ${own.country}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://flagcdn.com/w40/${m.isoCode.toLowerCase()}.png`}
                            alt=""
                            width={20}
                            height={14}
                            className={own.flag}
                          />
                          {m.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
