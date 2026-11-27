"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { profileHref } from "@/lib/profile";
import styles from "./Profile.module.css";

// Invite link: the native share sheet where there is one, else the clipboard.
export default function ShareButton({ profileId, className }: { profileId: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}${profileHref(profileId)}`;
    track("profile-share");
    if (navigator.share) {
      try {
        await navigator.share({ title: "My whereabout", url });
        return;
      } catch {
        // Dismissed, or unsupported here: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your link:", url);
    }
  }
  return (
    <button type="button" className={className ?? styles.ghost} onClick={share}>
      {copied ? "LINK COPIED" : "SHARE"}
    </button>
  );
}
