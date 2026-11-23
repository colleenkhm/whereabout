"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

export type ContributeKind = "add" | "dispute";

// Card title -> what it accepts. Missing (Map) = not contributable. Mirrors the Edge Function.
export const CONTRIBUTE_SECTIONS: Record<string, ContributeKind> = {
  "Visa & Entry": "dispute",
  Cities: "add",
  "Border Countries": "dispute",
  Languages: "dispute",
  "Travel Advisory": "dispute",
  "Practical Norms": "add",
  "When to Visit": "add",
  Resources: "add",
  "Something Else?": "add",
};

// Contribute-only catch-all card: no stamp, its own prompt.
export const OTHER_SECTION = "Something Else?";

export const CITY_CATEGORIES: [string, string][] = [
  ["activity", "Activity"],
  ["restaurant", "Restaurant"],
  ["place_to_stay", "Place to stay"],
  ["other", "Something else"],
];

export const contributeHref = (iso: string) => `/country/${iso.toLowerCase()}?mode=contribute`;

// Off in prerendered HTML (static export has no request-time query); read from the URL after hydration.
export function useContributeMode(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("mode") === "contribute",
    () => false,
  );
}
const noopSubscribe = () => () => {};

export interface Contribution {
  countryIso: string;
  countryName: string;
  section: string;
  text: string;
  tips: string;
  source: string;
  email: string;
  certified: boolean;
  linkAccount: boolean;
  city?: string;
  category?: string;
  website: string; // honeypot
}

// Null on success, else a message to show.
export async function submitContribution(c: Contribution): Promise<string | null> {
  try {
    const { data, error } = await supabase().functions.invoke("submit-contribution", { body: c });
    if (!error && data?.ok) return null;
    // Function errors carry their Response on error.context.
    const res = (error as { context?: Response } | null)?.context;
    const body = await res?.json?.().catch(() => null);
    // Real cause for devtools. No response usually = function not deployed (its 404 fails the CORS preflight).
    console.error(
      "submit-contribution failed:",
      res?.status ?? "no response (not deployed, or blocked by CORS)",
      body ?? error?.message ?? data,
    );
    // A 400 is the function's own message about the input; anything else stays generic.
    return res?.status === 400 && body?.error ? body.error : "Couldn't send that. Please try again.";
  } catch (e) {
    console.error("submit-contribution threw:", e);
    return "Couldn't send that. Please try again.";
  }
}

// Remembered so a second submission doesn't need retyping.
const EMAIL_KEY = "whereabout.contributor-email";
export function loadEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}
export function saveEmail(email: string) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {}
}
