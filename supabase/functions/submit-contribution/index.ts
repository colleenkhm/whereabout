// whereabout: add/dispute contributions — Edge Function
//
// Stores each submission in correction_reports, then emails it via Resend.
// The row is the durable record; a failed email doesn't fail the request.
//
// Setup (one-time, per project):
//   supabase secrets set RESEND_API_KEY=re_... CONTRIBUTIONS_TO=you@example.com
//   (optional) supabase secrets set CONTRIBUTIONS_FROM="whereabout <contribute@your-domain>"
//   supabase functions deploy submit-contribution
//
// Without a verified Resend domain, the default onboarding@resend.dev sender
// can only deliver to the Resend account's own address, which is all this needs.

import { createClient } from "npm:@supabase/supabase-js@2";
import { addSubscriber } from "../_shared/subscribers.ts";
import { type Body, toRow, validate } from "./validate.ts";

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
  if (!result.ok) {
    console.warn("Rejected:", result.error);
    return json({ error: result.error }, 400);
  }
  const sub = result.value;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row, error } = await supabase.from("correction_reports").insert(toRow(sub)).select("id").single();

  if (error) {
    // 23503: unknown country. 42703: migration 043 not applied.
    console.error("Insert failed:", error.code, error.message);
    return json({ error: "Couldn't save that. Please try again." }, error.code === "23503" ? 400 : 500);
  }

  // Opt-in checkbox; a failure here doesn't fail the submission.
  if (sub.wantsUpdates) await addSubscriber(supabase, sub.email, sub.iso ? "contribution" : "feedback");

  await sendEmail({
    id: row.id,
    kind: sub.kind,
    section: sub.sectionTitle,
    country: sub.iso ? `${sub.countryName} (${sub.iso})` : "",
    text: sub.text,
    why: sub.why,
    tips: sub.tips,
    source: sub.source,
    email: sub.email,
    linkAccount: sub.linkAccount,
    wantsUpdates: sub.wantsUpdates,
    city: sub.city,
    category: sub.category,
  });

  return json({ ok: true, id: row.id });
});

async function sendEmail(s: {
  id: string;
  kind: string;
  section: string;
  country: string;
  text: string;
  why: string;
  tips: string;
  source: string;
  email: string;
  linkAccount: boolean;
  wantsUpdates: boolean;
  city: string;
  category: string;
}) {
  const key = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("CONTRIBUTIONS_TO");
  if (!key || !to) {
    console.warn("RESEND_API_KEY / CONTRIBUTIONS_TO not set; stored without emailing", s.id);
    return;
  }
  const verb = !s.country ? "Feedback" : s.kind === "add" ? "Add" : "Dispute";
  // Feedback has no country.
  const where = s.country ? `${s.section}, ${s.country}` : "general";
  const lines = [
    [verb, ...(s.country ? [s.section, s.country] : [])].join(" · "),
    "",
    ...(s.city ? [`City: ${s.city}`] : []),
    ...(s.category ? [`Category: ${s.category.replace(/_/g, " ")}`] : []),
    ...(s.city || s.category ? [""] : []),
    s.text,
    "",
    ...(s.why ? ["Why recommended:", s.why, ""] : []),
    ...(s.tips ? ["Tips & things to know:", s.tips, ""] : []),
    `Source: ${s.source || "(none given)"}`,
    `Contributor email: ${s.email}`,
    `Link to their account later: ${s.linkAccount ? "yes" : "no"}`,
    `Wants email updates: ${s.wantsUpdates ? "yes" : "no"}`,
    "Certified true to the best of their knowledge: yes",
    "",
    `correction_reports.id = ${s.id}`,
  ];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("CONTRIBUTIONS_FROM") ?? "whereabout <onboarding@resend.dev>",
        to: [to],
        reply_to: s.email,
        subject: `[whereabout] ${verb}: ${where}`,
        text: lines.join("\n"),
      }),
    });
    if (!res.ok) console.error("Resend failed:", res.status, await res.text());
  } catch (e) {
    console.error("Resend error:", e);
  }
}
