// Pure input check for subscribe-updates. No I/O, so it's unit-tested.
import { EMAIL_RE } from "../_shared/subscribers.ts";

export interface Body {
  email?: unknown;
  website?: unknown; // honeypot
}

export type Validation = { ok: true; email: string } | { ok: false; error: string } | { spam: true };

export function validate(body: Body): Validation {
  if (body.website) return { spam: true };
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email" };
  return { ok: true, email };
}
