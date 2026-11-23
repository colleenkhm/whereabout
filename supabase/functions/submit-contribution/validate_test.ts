import { assertEquals } from "jsr:@std/assert@1";
import { type Body, toRow, validate } from "./validate.ts";

const base: Body = {
  countryIso: "pt",
  countryName: "Portugal",
  section: "When to Visit",
  text: "  Late September is quieter and still warm.  ",
  source: "",
  email: "a@b.co",
  certified: true,
};

function valid(body: Body) {
  const r = validate(body);
  if (!("ok" in r) || !r.ok) throw new Error(`expected valid, got ${JSON.stringify(r)}`);
  return r.value;
}
const errorOf = (body: Body) => {
  const r = validate(body);
  return "ok" in r && !r.ok ? r.error : null;
};

Deno.test("valid add: trims, uppercases ISO, maps section", () => {
  const v = valid(base);
  assertEquals(v.iso, "PT");
  assertEquals(v.kind, "add");
  assertEquals(v.subject, "best_time");
  assertEquals(v.text, "Late September is quieter and still warm.");
  assertEquals(v.linkAccount, false);
});

Deno.test("dispute sections map to dispute", () => {
  assertEquals(valid({ ...base, section: "Visa & Entry" }).kind, "dispute");
  assertEquals(valid({ ...base, section: "Travel Advisory" }).subject, "advisory");
});

Deno.test("something else maps to general", () => {
  assertEquals(valid({ ...base, section: "Something Else?" }).subject, "general");
});

Deno.test("tips land in details on add cards only", () => {
  assertEquals(toRow(valid({ ...base, tips: " Go early. " })).details, { tips: "Go early." });
  assertEquals(toRow(valid(base)).details, null);
  assertEquals(valid({ ...base, section: "Languages", tips: "x" }).tips, "");
});

Deno.test("why recommended lands in details on Cities only", () => {
  const city = { ...base, section: "Cities", city: "Lisbon", why: " Best pastéis. " };
  assertEquals(toRow(valid(city)).details, { city: "Lisbon", category: null, why: "Best pastéis." });
  assertEquals(valid({ ...base, why: "x" }).why, "");
});

Deno.test("email is required and must look like one", () => {
  assertEquals(errorOf({ ...base, email: "" }), "Please enter a valid email");
  assertEquals(errorOf({ ...base, email: undefined }), "Please enter a valid email");
  assertEquals(errorOf({ ...base, email: "not-an-email" }), "Please enter a valid email");
});

Deno.test("certification must be literally true", () => {
  assertEquals(errorOf({ ...base, certified: false }), "Please confirm the certification");
  assertEquals(errorOf({ ...base, certified: "true" }), "Please confirm the certification");
});

Deno.test("rejects empty text, unknown section, bad ISO", () => {
  assertEquals(errorOf({ ...base, text: "   " }), "Please write something to submit");
  assertEquals(errorOf({ ...base, section: "Map" }), "Unknown section");
  assertEquals(errorOf({ ...base, countryIso: "p1" }), "Unknown country");
});

Deno.test("honeypot is flagged as spam", () => {
  assertEquals(validate({ ...base, website: "http://spam" }), { spam: true });
});

Deno.test("linkAccount only when literally true", () => {
  assertEquals(valid({ ...base, linkAccount: true }).linkAccount, true);
  assertEquals(valid({ ...base, linkAccount: "yes" }).linkAccount, false);
});

Deno.test("city fields kept on Cities, dropped elsewhere", () => {
  const city = valid({ ...base, section: "Cities", city: "Lisbon", category: "restaurant" });
  assertEquals(toRow(city).details, { city: "Lisbon", category: "restaurant" });
  assertEquals(toRow(valid({ ...base, city: "Lisbon", category: "restaurant" })).details, null);
  assertEquals(errorOf({ ...base, section: "Cities", category: "bar" }), "Unknown category");
});

Deno.test("bare URL source goes to source_url; other text is appended", () => {
  const url = toRow(valid({ ...base, source: "https://example.com/x" }));
  assertEquals(url.source_url, "https://example.com/x");
  assertEquals(url.report_text, "Late September is quieter and still warm.");

  const note = toRow(valid({ ...base, source: "a local guide" }));
  assertEquals(note.source_url, null);
  assertEquals(note.report_text, "Late September is quieter and still warm.\n\nSource: a local guide");
});

Deno.test("long input is capped", () => {
  assertEquals(valid({ ...base, text: "x".repeat(5000) }).text.length, 4000);
});
