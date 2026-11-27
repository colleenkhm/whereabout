"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { track } from "@/lib/analytics";
import { acceptFriendRequest, removeFriendship, sendFriendRequest } from "@/lib/friends";
import { profileHref, type PublicProfile } from "@/lib/profile";
import styles from "./Profile.module.css";

// Someone else's masthead: add / pending / accept / companions.
export default function RelationshipAction({
  profile,
  viewer,
  onChange,
}: {
  profile: PublicProfile;
  viewer: User | null;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function run(action: () => Promise<boolean>, event: string) {
    setBusy(true);
    setError(false);
    const ok = await action();
    setBusy(false);
    if (!ok) return setError(true);
    track(event);
    onChange();
  }

  const errorLine = error && (
    <span className={`tf-sub ${styles.mastNote}`} role="alert">
      Couldn&apos;t update. Please try again.
    </span>
  );

  switch (profile.relationship) {
    case "anon":
      return (
        <Link
          href={`/account?next=${encodeURIComponent(profileHref(profile.id))}`}
          className={`${styles.ghost} ${styles.ghostFilled}`}
        >
          SIGN IN TO ADD AS COMPANION
        </Link>
      );
    case "none":
      return (
        <>
          <button
            type="button"
            className={`${styles.ghost} ${styles.ghostFilled}`}
            disabled={busy}
            onClick={() => run(() => sendFriendRequest(viewer!.id, profile.id), "companion-request")}
          >
            {busy ? "SENDING…" : "ADD AS TRAVEL COMPANION"}
          </button>
          {errorLine}
        </>
      );
    case "requested":
      return (
        <>
          <span className={`tf-sub ${styles.mastNote}`}>Companion request sent.</span>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => run(() => removeFriendship(viewer!.id, profile.id), "companion-cancel")}
          >
            CANCEL
          </button>
          {errorLine}
        </>
      );
    case "incoming":
      return (
        <>
          <button
            type="button"
            className={`${styles.ghost} ${styles.ghostFilled}`}
            disabled={busy}
            onClick={() => run(() => acceptFriendRequest(profile.id), "companion-accept")}
          >
            ACCEPT COMPANION REQUEST
          </button>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => run(() => removeFriendship(viewer!.id, profile.id), "companion-decline")}
          >
            DECLINE
          </button>
          {errorLine}
        </>
      );
    case "friends":
      return <span className={`tf-sub ${styles.mastNote}`}>Travel companions</span>;
    default:
      return null;
  }
}
