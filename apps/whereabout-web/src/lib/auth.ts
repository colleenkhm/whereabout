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

export async function sendMagicLink(email: string): Promise<string | null> {
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
