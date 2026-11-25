"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdAdd, MdCheck } from "react-icons/md";
import { track } from "@/lib/analytics";
import { useUser } from "@/lib/auth";
import { fetchCountryMarks, MARK_KINDS, setCountryMark, type MarkKind } from "@/lib/countryMarks";
import styles from "./CountryMarks.module.css";

const LABELS: Record<MarkKind, string> = { visited: "VISITED", interested: "INTERESTED" };

// VISITED / INTERESTED toggles in the masthead. Signed out, they link to sign-in and back.
// Import via AccountsGate so flag-off builds drop it.
export default function CountryMarks({ isoCode }: { isoCode: string }) {
  const user = useUser();
  const [marks, setMarks] = useState<Set<MarkKind>>(new Set());
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCountryMarks(isoCode).then((m) => m && setMarks(m));
  }, [user, isoCode]);

  if (user === undefined) return null;

  if (!user) {
    const next = encodeURIComponent(`/country/${isoCode.toLowerCase()}`);
    return (
      <div className={styles.row}>
        {MARK_KINDS.map((kind) => (
          <Link key={kind} href={`/account?next=${next}`} className={`tf-link ${styles.mark}`}>
            <MdAdd size={14} aria-hidden />
            {LABELS[kind]}
          </Link>
        ))}
      </div>
    );
  }

  async function toggle(kind: MarkKind) {
    const on = !marks.has(kind);
    const apply = (add: boolean) => (s: Set<MarkKind>) => {
      const n = new Set(s);
      if (add) n.add(kind);
      else n.delete(kind);
      return n;
    };
    // Optimistic; rolled back on failure.
    setMarks(apply(on));
    setError(false);
    if (await setCountryMark(user!.id, isoCode, kind, on)) {
      track(on ? `mark-${kind}` : `unmark-${kind}`);
    } else {
      setMarks(apply(!on));
      setError(true);
    }
  }

  return (
    <div className={styles.row}>
      {MARK_KINDS.map((kind) => {
        const on = marks.has(kind);
        return (
          <button
            key={kind}
            type="button"
            className={`tf-link ${styles.mark} ${on ? styles.on : ""}`}
            aria-pressed={on}
            onClick={() => toggle(kind)}
          >
            {on ? <MdCheck size={14} aria-hidden /> : <MdAdd size={14} aria-hidden />}
            {LABELS[kind]}
          </button>
        );
      })}
      {error && (
        <span className={styles.error} role="alert">
          Couldn&apos;t save. Try again.
        </span>
      )}
    </div>
  );
}
