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
      // Sign-in is by emailed code, never a link back to the site.
      detectSessionInUrl: false,
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

// Same-site paths only.
export const safeReturnPath = (path: string | null): string | null =>
  path && /^\/(?![/\\])/.test(path) ? path : null;

// Emails a one-time code; also creates the account on first use.
export async function sendSignInCode(email: string): Promise<string | null> {
  const { error } = await authClient().auth.signInWithOtp({ email });
  if (!error) return null;
  return error.status === 429
    ? "We're sending a lot of sign-in codes right now. Please try again in a few minutes."
    : "Couldn't send a code. Please try again.";
}

export async function verifySignInCode(email: string, code: string): Promise<string | null> {
  const { error } = await authClient().auth.verifyOtp({ email, token: code, type: "email" });
  if (!error) return null;
  return error.status === 429
    ? "Too many tries. Please wait a minute and try again."
    : "That code is wrong or has expired. Check it, or send a new one.";
}

export async function signOut(): Promise<void> {
  await authClient().auth.signOut();
}
