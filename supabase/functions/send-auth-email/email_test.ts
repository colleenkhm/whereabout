import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1";
import { isCodeAction, renderCodeEmail } from "./email.ts";

Deno.test("signup and magiclink get their own subjects, with the code", () => {
  const signup = renderCodeEmail("signup", "123456");
  const login = renderCodeEmail("magiclink", "654321");
  assertEquals(signup.subject, "Finish creating your whereabout account");
  assertEquals(login.subject, "Your whereabout sign-in code");
  assert(signup.html.includes("123456") && signup.text.includes("123456"));
  assert(login.html.includes("654321") && login.text.includes("654321"));
});

Deno.test("no links back to the site except the footer", () => {
  const { html } = renderCodeEmail("magiclink", "123456");
  assertEquals(html.match(/<a /g)?.length, 1);
});

Deno.test("rejects anything but a numeric code", () => {
  assertThrows(() => renderCodeEmail("signup", "<b>x</b>"));
});

Deno.test("only code actions are supported", () => {
  assert(isCodeAction("signup"));
  assert(!isCodeAction("recovery"));
  assert(!isCodeAction("email_change"));
});
