"use client";

import { authClient } from "./auth";

// Visited / interested marks (country_marks, own rows only via RLS).
export type MarkKind = "visited" | "interested";
export const MARK_KINDS: MarkKind[] = ["visited", "interested"];

export interface MarkedCountry {
  isoCode: string;
  name: string;
  kind: MarkKind;
}

export async function fetchCountryMarks(isoCode: string): Promise<Set<MarkKind> | null> {
  const { data, error } = await authClient().from("country_marks").select("kind").eq("country_id", isoCode);
  if (error) return null;
  return new Set(data.map((r) => r.kind as MarkKind));
}

// Returns false on failure so the caller can roll back.
export async function setCountryMark(userId: string, isoCode: string, kind: MarkKind, on: boolean): Promise<boolean> {
  const table = authClient().from("country_marks");
  const { error } = on
    ? await table.upsert({ user_id: userId, country_id: isoCode, kind }, { ignoreDuplicates: true })
    : await table.delete().match({ user_id: userId, country_id: isoCode, kind });
  return !error;
}

export async function fetchAllMarks(): Promise<MarkedCountry[] | null> {
  const { data, error } = await authClient()
    .from("country_marks")
    .select("country_id, kind, countries(name_common)");
  if (error) return null;
  return data
    .map((r) => {
      // One-to-one embed; typed loosely by supabase-js.
      const c = r.countries as unknown as { name_common: string } | null;
      return { isoCode: r.country_id as string, name: c?.name_common ?? r.country_id, kind: r.kind as MarkKind };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
