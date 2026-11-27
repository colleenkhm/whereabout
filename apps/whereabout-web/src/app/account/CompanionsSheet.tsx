"use client";

import { useState } from "react";
import Link from "next/link";
import form from "@/components/country/ContributeForm.module.css";
import { track } from "@/lib/analytics";
import { acceptFriendRequest, initialOf, removeFriendship, type Companion, type FriendRequest } from "@/lib/friends";
import { profileHref } from "@/lib/profile";
import { useAvatarUrl } from "./Avatar";
import ShareButton from "./ShareButton";
import styles from "./Profile.module.css";

// userId: set on your own profile (invite link, requests, remove). Else a read-only list.
export default function CompanionsSheet({
  userId,
  profileId,
  companions: initialCompanions,
  requests: initialRequests,
  onChange,
}: {
  userId: string | null;
  profileId: string;
  companions: Companion[];
  requests: FriendRequest[];
  onChange: () => void;
}) {
  // Local copies so the open sheet updates as you act.
  const [companions, setCompanions] = useState(initialCompanions);
  const [requests, setRequests] = useState(initialRequests);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function act(id: string, action: () => Promise<boolean>, event: string, after: () => void) {
    setBusy(id);
    setError(false);
    const ok = await action();
    setBusy(null);
    if (!ok) return setError(true);
    track(event);
    after();
    onChange();
  }

  const incoming = requests.filter((r) => r.direction === "incoming");
  const outgoing = requests.filter((r) => r.direction === "outgoing");
  const dropRequest = (id: string) => setRequests((rs) => rs.filter((r) => r.id !== id));

  return (
    <div className={styles.sheetBody}>
      {userId && (
        <section className={styles.field}>
          <p className="s-body">
            <b>Invite a companion</b>
            <br />
            Send your link. When they open it and tap Add, you&apos;ll get a request here.
          </p>
          <ShareButton profileId={profileId} className={`${form.submit} ${styles.small}`} />
        </section>
      )}

      {userId && incoming.length > 0 && (
        <section className={styles.field}>
          <h3 className="tk-eyebrow">REQUESTS</h3>
          <ul className={styles.people}>
            {incoming.map((r) => (
              <li key={r.id} className={styles.person}>
                <Circle name={r.displayName} path={null} />
                <span className={`s-body ${styles.personName}`}>{r.displayName ?? "Someone"}</span>
                <span className={styles.personActions}>
                  <button
                    type="button"
                    className={`${form.submit} ${styles.small}`}
                    disabled={busy === r.id}
                    onClick={() =>
                      act(r.id, () => acceptFriendRequest(r.id), "companion-accept", () => {
                        dropRequest(r.id);
                        setCompanions((cs) => [{ id: r.id, displayName: r.displayName, avatarPath: null }, ...cs]);
                      })
                    }
                  >
                    ACCEPT
                  </button>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={busy === r.id}
                    onClick={() => act(r.id, () => removeFriendship(userId, r.id), "companion-decline", () => dropRequest(r.id))}
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.field}>
        <h3 className="tk-eyebrow">COMPANIONS · {companions.length}</h3>
        {companions.length === 0 ? (
          <p className="src-row">None yet.</p>
        ) : (
          <ul className={styles.people}>
            {companions.map((c) => (
              <li key={c.id} className={styles.person}>
                <Circle name={c.displayName} path={c.avatarPath} />
                <Link href={profileHref(c.id)} className={`s-body ${styles.personName}`}>
                  {c.displayName ?? "Traveler"}
                </Link>
                {userId && (
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={busy === c.id}
                    onClick={() =>
                      act(c.id, () => removeFriendship(userId, c.id), "companion-remove", () =>
                        setCompanions((cs) => cs.filter((x) => x.id !== c.id)),
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {userId && outgoing.length > 0 && (
        <section className={styles.field}>
          <h3 className="tk-eyebrow">SENT</h3>
          <ul className={styles.people}>
            {outgoing.map((r) => (
              <li key={r.id} className={styles.person}>
                <Circle name={r.displayName} path={null} />
                <span className={`s-body ${styles.personName}`}>{r.displayName ?? "Someone"}</span>
                <button
                  type="button"
                  className={styles.textButton}
                  disabled={busy === r.id}
                  onClick={() => act(r.id, () => removeFriendship(userId, r.id), "companion-cancel", () => dropRequest(r.id))}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="s-body error-text" role="alert">
          Couldn&apos;t update. Please try again.
        </p>
      )}
    </div>
  );
}

function Circle({ name, path }: { name: string | null; path: string | null }) {
  const url = useAvatarUrl(path);
  return (
    <span className={styles.circle} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" /> : initialOf(name)}
    </span>
  );
}
