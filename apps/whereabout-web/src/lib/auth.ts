"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

// Browser-only client that keeps a session. Public reads stay on supabase() (no session).
let client: SupabaseClient | null = null;

export function authClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Magic link lands on /account?code=…; the client exchanges it.
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "whereabout-auth",
    },
  });
  return client;
}

// Current user; undefined while the stored session loads.
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const { data } = authClient().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

// Where to go after the magic link signs someone in (e.g. back to a country page).
// localStorage, not the redirect URL: the link opens in a new tab, and Supabase's redirect list stays exact.
const RETURN_KEY = "whereabout-return-to";

// Same-site paths only.
export const safeReturnPath = (path: string | null): string | null =>
  path && /^\/(?![/\\])/.test(path) ? path : null;

export function takeReturnPath(): string | null {
  try {
    const path = localStorage.getItem(RETURN_KEY);
    localStorage.removeItem(RETURN_KEY);
    return safeReturnPath(path);
  } catch {
    return null;
  }
}

export async function sendMagicLink(email: string, returnTo?: string | null): Promise<string | null> {
  try {
    if (returnTo) localStorage.setItem(RETURN_KEY, returnTo);
    else localStorage.removeItem(RETURN_KEY);
  } catch {
    // Storage blocked: sign-in still works, just lands on /account.
  }
  const { error } = await authClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/account` },
  });
  if (!error) return null;
  return error.status === 429
    ? "Too many sign-in emails. Please wait a few minutes and try again."
    : "Couldn't send the sign-in link. Please try again.";
}

export async function signOut(): Promise<void> {
  await authClient().auth.signOut();
}
