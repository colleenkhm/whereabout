import { assertEquals } from "jsr:@std/assert@1";
import { validate } from "./validate.ts";

Deno.test("valid email is trimmed", () => {
  assertEquals(validate({ email: "  a@b.co " }), { ok: true, email: "a@b.co" });
});

Deno.test("bad or missing email is rejected", () => {
  assertEquals(validate({ email: "nope" }), { ok: false, error: "Please enter a valid email" });
  assertEquals(validate({}), { ok: false, error: "Please enter a valid email" });
});

Deno.test("honeypot is flagged as spam", () => {
  assertEquals(validate({ email: "a@b.co", website: "x" }), { spam: true });
});
