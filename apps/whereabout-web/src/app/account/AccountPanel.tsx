"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdOutlineAccountCircle } from "react-icons/md";
import form from "@/components/country/ContributeForm.module.css";
import { track } from "@/lib/analytics";
import { safeReturnPath, sendMagicLink, signOut, takeReturnPath, useUser } from "@/lib/auth";
import styles from "../contribute/Contribute.module.css";
import MarkedCountries from "./MarkedCountries";

// Sign in / create account by magic link, or the signed-in view.
export default function AccountPanel() {
  const user = useUser();
  const router = useRouter();

  // Back to where sign-in started (e.g. a country page), once the link signs them in.
  useEffect(() => {
    if (!user) return;
    const back = takeReturnPath();
    if (back) router.replace(back);
  }, [user, router]);

  return (
    <>
    <section className={styles.option}>
      <div className={`${styles.head} ${styles.inkHead}`}>
        <MdOutlineAccountCircle size={22} aria-hidden />
        <h2 className="sec-name">{user ? "Signed in" : "Sign in or create an account"}</h2>
      </div>
      <div className={styles.body}>
        {user === undefined ? (
          <p className="s-body">Loading…</p>
        ) : user ? (
          <SignedIn email={user.email ?? ""} />
        ) : (
          <SignInForm />
        )}
      </div>
    </section>
    {user && <MarkedCountries />}
    </>
  );
}

function SignedIn({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className={styles.stack}>
      <p className="s-body">
        You&apos;re signed in as <b>{email}</b>.
      </p>
      <div>
        <button
          type="button"
          className={form.submit}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await signOut();
            track("sign-out");
            setBusy(false);
          }}
        >
          {busy ? "SIGNING OUT…" : "SIGN OUT"}
        </button>
      </div>
    </div>
  );
}

// Expired or reused magic link comes back with error_description.
function linkErrorFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search + window.location.hash.replace(/^#/, "&"));
  return params.get("error_description")
    ? "That sign-in link has expired or was already used. Please request a new one."
    : null;
}

// Set by a country page's VISITED / INTERESTED tags when signed out.
const returnPathFromUrl = () => safeReturnPath(new URLSearchParams(window.location.search).get("next"));

// Client-only: rendered after the session check, so window exists.
function SignInForm() {
  const [returnTo] = useState(returnPathFromUrl);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(linkErrorFromUrl);
  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && status === "idle";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setStatus("sending");
    setError(null);
    const err = await sendMagicLink(email.trim(), returnTo);
    if (err) {
      setError(err);
      setStatus("idle");
      return;
    }
    track("magic-link-sent");
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className={styles.stack}>
        <p className="s-body">
          Check <b>{email.trim()}</b> for a sign-in link. Open it in this browser to finish signing in{returnTo ? " and go back to that country" : ""}.
        </p>
        <span className="src-row">No email? Check spam, or wait a minute and try again.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={styles.stack}>
      {returnTo && <p className="s-body"><b>Sign in to mark countries as visited or interested.</b></p>}
      <label htmlFor="account-email" className="s-body">
        Enter your email and we&apos;ll send you a link to sign in. New here? The same link creates your account.
      </label>
      <div className={form.inline}>
        <input
          id="account-email"
          className={form.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={254}
          required
        />
        <button type="submit" className={form.submit} disabled={!ready}>
          {status === "sending" ? "SENDING…" : "SEND LINK"}
        </button>
      </div>
      <span className="src-row">
        No password to remember, reuse or leak. Each link works once and expires after an hour.
      </span>
      {error && (
        <p className="s-body error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
