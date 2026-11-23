// whereabout: email-updates sign-up — Edge Function
//
// Stores the email in update_subscribers. Nothing is sent yet.
// Deploy: supabase functions deploy subscribe-updates

import { createClient } from "npm:@supabase/supabase-js@2";
import { addSubscriber } from "../_shared/subscribers.ts";
import { type Body, validate } from "./validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const result = validate(body);
  // Pretend it worked, so bots don't retry.
  if ("spam" in result) return json({ ok: true });
  if (!result.ok) return json({ error: result.error }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ok = await addSubscriber(supabase, result.email, "signup");
  return ok ? json({ ok: true }) : json({ error: "Couldn't save that. Please try again." }, 500);
});
