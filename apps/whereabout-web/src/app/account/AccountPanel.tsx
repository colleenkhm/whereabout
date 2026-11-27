"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MdOutlineAccountCircle } from "react-icons/md";
import form from "@/components/country/ContributeForm.module.css";
import { track } from "@/lib/analytics";
import { safeReturnPath, sendSignInCode, signOut, useUser, verifySignInCode } from "@/lib/auth";
import styles from "../contribute/Contribute.module.css";
import own from "./Account.module.css";
import MarkedCountries from "./MarkedCountries";

// Sign in / create account with an emailed code, or the signed-in view.
export default function AccountPanel() {
  const user = useUser();
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

// Set by a country page's VISITED / INTERESTED tags when signed out.
const returnPathFromUrl = () => safeReturnPath(new URLSearchParams(window.location.search).get("next"));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Supabase's code length is a project setting (6–10 digits).
const CODE = /^\d{6,10}$/;

// Two steps: email, then the code from the email. Client-only (after the session check), so window exists.
function SignInForm() {
  const router = useRouter();
  const [returnTo] = useState(returnPathFromUrl);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!EMAIL.test(email.trim()) || busy) return;
    setBusy(true);
    setError(null);
    const err = await sendSignInCode(email.trim());
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    track("sign-in-code-sent");
    setResent(step === "code");
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!CODE.test(code) || busy) return;
    setBusy(true);
    setError(null);
    const err = await verifySignInCode(email.trim(), code);
    if (err) {
      setBusy(false);
      setError(err);
      return;
    }
    track("sign-in");
    // Otherwise the panel switches to the signed-in view on its own.
    if (returnTo) router.replace(returnTo);
  }

  const errorLine = error && (
    <p className="s-body error-text" role="alert">
      {error}
    </p>
  );

  if (step === "code") {
    return (
      <form onSubmit={verify} noValidate className={styles.stack}>
        <label htmlFor="account-code" className="s-body">
          We emailed a sign-in code to <b>{email.trim()}</b>. Enter it here.
        </label>
        <div className={form.inline}>
          <input
            id="account-code"
            className={form.input}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            maxLength={10}
            autoFocus
            required
          />
          <button type="submit" className={form.submit} disabled={!CODE.test(code) || busy}>
            {busy ? "CHECKING…" : "SIGN IN"}
          </button>
        </div>
        <span className="src-row">
          {resent ? "New code sent. " : "No email? Check spam. "}
          <button type="button" className={`src-row ${own.textButton}`} onClick={() => sendCode()} disabled={busy}>
            Send a new code
          </button>
          {" · "}
          <button
            type="button"
            className={`src-row ${own.textButton}`}
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
              setResent(false);
            }}
          >
            Use a different email
          </button>
        </span>
        {errorLine}
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate className={styles.stack}>
      {returnTo && (
        <p className="s-body">
          <b>Sign in to mark countries as visited or interested.</b>
        </p>
      )}
      <label htmlFor="account-email" className="s-body">
        Enter your email and we&apos;ll send you a code to sign in. New here? The same code creates your account.
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
        <button type="submit" className={form.submit} disabled={!EMAIL.test(email.trim()) || busy}>
          {busy ? "SENDING…" : "SEND CODE"}
        </button>
      </div>
      <span className="src-row">No password to remember, reuse or leak. Each code works once and expires after an hour.</span>
      {errorLine}
    </form>
  );
}
