// Adds an email to update_subscribers. A repeat sign-up is a no-op, not an error.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addSubscriber(
  supabase: SupabaseClient,
  email: string,
  source: "signup" | "feedback" | "contribution",
): Promise<boolean> {
  const { error } = await supabase.from("update_subscribers").insert({ email, source });
  // 23505: already subscribed.
  if (error && error.code !== "23505") {
    console.error("Subscriber insert failed:", error.code, error.message);
    return false;
  }
  return true;
}
