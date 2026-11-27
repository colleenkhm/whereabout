// whereabout: Supabase Auth "Send Email" hook — Edge Function
//
// Auth calls this instead of its own mailer (custom SMTP and template editing need Pro).
// It emails the sign-in code via Resend. Signed with Standard Webhooks; no JWT.
//
// Setup (one-time, per project):
//   1. supabase functions deploy send-auth-email --no-verify-jwt
//   2. Dashboard → Authentication → Hooks → Send Email hook → HTTPS,
//      URL https://<project-ref>.supabase.co/functions/v1/send-auth-email, generate a secret.
//      Check the dashboard URL shows that same <project-ref>: the hook belongs to the
//      project whose dashboard it's saved in, not the one its URL points at.
//   3. supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_..."
//      (RESEND_API_KEY is already set for submit-contribution.)
//   (optional) supabase secrets set AUTH_EMAIL_FROM="whereabout <hello@your-domain>"
//   (dev only) supabase secrets set AUTH_EMAIL_SUBJECT_PREFIX="[staging]"
//
// Without a verified Resend domain, onboarding@resend.dev only delivers to the
// Resend account's own address: fine for staging, not for real users.

import { Webhook } from "npm:standardwebhooks@1.0.0";
import { isCodeAction, renderCodeEmail } from "./email.ts";

interface HookPayload {
  user: { email: string };
  email_data: { token: string; email_action_type: string };
}

// Auth shows message to the client on failure.
const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail(405, "POST only");

  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!secret || !resendKey) {
    console.error("SEND_EMAIL_HOOK_SECRET / RESEND_API_KEY not set");
    return fail(500, "Email isn't configured.");
  }

  const raw = await req.text();
  let payload: HookPayload;
  try {
    const wh = new Webhook(secret.replace(/^v1,whsec_/, ""));
    payload = wh.verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return fail(401, "Invalid signature");
  }

  const { email_action_type: action, token } = payload.email_data;
  if (!isCodeAction(action)) {
    console.warn("Unsupported email action:", action);
    return fail(400, "This kind of email isn't supported.");
  }

  let email;
  try {
    email = renderCodeEmail(action, token);
  } catch (e) {
    console.error("Render failed:", (e as Error).message);
    return fail(500, "Couldn't build the email.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("AUTH_EMAIL_FROM") ?? "whereabout <onboarding@resend.dev>",
      to: [payload.user.email],
      // Tells staging codes apart from prod ones.
      subject: [Deno.env.get("AUTH_EMAIL_SUBJECT_PREFIX"), email.subject].filter(Boolean).join(" "),
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    console.error("Resend failed:", res.status, await res.text());
    return fail(502, "Couldn't send the email.");
  }

  return new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
});
