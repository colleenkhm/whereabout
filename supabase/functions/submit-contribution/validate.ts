// Pure input checks + row shaping for submit-contribution. No I/O, so it's unit-tested.

// Card title -> subject_type and the one kind it accepts. Mirrors the client's CONTRIBUTE_SECTIONS.
export const SECTIONS: Record<string, { subject: string; kind: "add" | "dispute" }> = {
  "Visa & Entry": { subject: "visa", kind: "dispute" },
  Cities: { subject: "city", kind: "add" },
  "Border Countries": { subject: "border", kind: "dispute" },
  Languages: { subject: "language", kind: "dispute" },
  "Travel Advisory": { subject: "advisory", kind: "dispute" },
  "Practical Norms": { subject: "practical_norm", kind: "add" },
  "When to Visit": { subject: "best_time", kind: "add" },
  Resources: { subject: "resource", kind: "add" },
  "Something Else?": { subject: "general", kind: "add" },
  // Site-wide, no country.
  "General Feedback": { subject: "feedback", kind: "add" },
};

const CITY_CATEGORIES = ["activity", "restaurant", "place_to_stay", "other"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Body {
  countryIso?: unknown;
  countryName?: unknown;
  section?: unknown;
  text?: unknown;
  why?: unknown;
  tips?: unknown;
  source?: unknown;
  email?: unknown;
  certified?: unknown;
  linkAccount?: unknown;
  wantsUpdates?: unknown;
  city?: unknown;
  category?: unknown;
  website?: unknown; // honeypot
}

export interface Submission {
  iso: string;
  countryName: string;
  sectionTitle: string;
  kind: "add" | "dispute";
  subject: string;
  text: string;
  why: string;
  tips: string;
  source: string;
  email: string;
  linkAccount: boolean;
  wantsUpdates: boolean;
  city: string;
  category: string;
}

export type Validation = { ok: true; value: Submission } | { ok: false; error: string } | { spam: true };

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export function validate(body: Body): Validation {
  // Bots fill every field.
  if (body.website) return { spam: true };

  const sectionTitle = clean(body.section, 40);
  const section = SECTIONS[sectionTitle];
  const feedback = section?.subject === "feedback";
  const iso = feedback ? "" : clean(body.countryIso, 3).toUpperCase();
  const text = clean(body.text, 4000);
  const email = clean(body.email, 254);
  const category = clean(body.category, 20);

  if (!section) return { ok: false, error: "Unknown section" };
  if (!feedback && !/^[A-Z]{2,3}$/.test(iso)) return { ok: false, error: "Unknown country" };
  if (!text) return { ok: false, error: "Please write something to submit" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email" };
  if (body.certified !== true) return { ok: false, error: "Please confirm the certification" };
  if (category && !CITY_CATEGORIES.includes(category)) return { ok: false, error: "Unknown category" };

  const isCity = section.subject === "city";
  return {
    ok: true,
    value: {
      iso,
      countryName: feedback ? "" : clean(body.countryName, 80) || iso,
      sectionTitle,
      kind: section.kind,
      subject: section.subject,
      text,
      // Optional: why recommended (Cities only), tips (add cards).
      why: section.subject === "city" ? clean(body.why, 4000) : "",
      tips: section.kind === "add" && !feedback ? clean(body.tips, 4000) : "",
      source: clean(body.source, 1000),
      email,
      linkAccount: body.linkAccount === true,
      wantsUpdates: body.wantsUpdates === true,
      // City fields only mean something on the Cities card.
      city: isCity ? clean(body.city, 120) : "",
      category: isCity ? category : "",
    },
  };
}

// A bare URL goes in source_url; anything else is appended to the report text.
export function toRow(s: Submission) {
  const isUrl = /^https?:\/\/\S+$/i.test(s.source);
  return {
    country_id: s.iso || null,
    kind: s.kind,
    subject_type: s.subject,
    report_text: isUrl || !s.source ? s.text : `${s.text}\n\nSource: ${s.source}`,
    source_url: isUrl ? s.source : null,
    reporter_contact: s.email,
    details: details(s),
    certified: true,
    link_to_account: s.linkAccount,
  };
}

function details(s: Submission) {
  const d: Record<string, string | null> = {};
  if (s.subject === "city") Object.assign(d, { city: s.city || null, category: s.category || null });
  if (s.why) d.why = s.why;
  if (s.tips) d.tips = s.tips;
  return Object.keys(d).length ? d : null;
}
