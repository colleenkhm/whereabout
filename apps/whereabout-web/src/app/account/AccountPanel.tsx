"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdOutlineAccountCircle } from "react-icons/md";
import form from "@/components/country/ContributeForm.module.css";
import { track } from "@/lib/analytics";
import { fetchProfile, type Profile } from "@/lib/profile";
import type { CountrySummary } from "@/lib/types";
import { safeReturnPath, sendSignInCode, signOut, useUser, verifySignInCode } from "@/lib/auth";
import styles from "../contribute/Contribute.module.css";
import own from "./Account.module.css";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import MarkedCountries from "./MarkedCountries";
import ProfileSetup from "./ProfileSetup";
import ProfileView from "./ProfileView";

// Sign in / create account with an emailed code, then profile setup, then the signed-in view.
export default function AccountPanel({
  countries,
  postcardColors,
}: {
  countries: CountrySummary[];
  postcardColors: Record<string, string[]>;
}) {
  const user = useUser();
  const router = useRouter();
  // Read once on the client; the panel renders nothing user-specific on the server.
  const [returnTo] = useState(() => (typeof window === "undefined" ? null : returnPathFromUrl()));
  const [profile, setProfile] = useState<{ userId: string; profile: Profile | null } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let live = true;
    fetchProfile(user.id).then((p) => live && setProfile({ userId: user.id, profile: p }));
    return () => {
      live = false;
    };
  }, [user]);

  // Loaded profile for the current user; undefined while loading.
  const current = user && profile?.userId === user.id ? profile.profile : undefined;
  const needsSetup = current != null && !current.completedAt;

  // Back to the page that sent them here, once setup is out of the way.
  useEffect(() => {
    if (returnTo && current?.completedAt && !editing) router.replace(returnTo);
  }, [returnTo, current, editing, router]);

  if (user && current && (needsSetup || editing)) {
    return (
      <Shell>
        <ProfileSetup
          userId={user.id}
          profile={current}
          countries={countries}
          onDone={(p) => {
            setProfile({ userId: user.id, profile: p });
            setEditing(false);
          }}
        />
      </Shell>
    );
  }

  // Finished profile: the dashboard (unless a redirect back is about to happen).
  if (user && current && !returnTo) {
    return (
      <ProfileView
        profileId={user.id}
        viewer={user}
        countries={countries}
        postcardColors={postcardColors}
        onEdit={() => setEditing(true)}
        footer={
          <>
            <MarkedCountries />
            <SignedInFooter email={user.email ?? ""} profile={current} />
          </>
        }
      />
    );
  }

  return (
    <Shell>
      <section className={styles.option}>
        <div className={`${styles.head} ${styles.inkHead}`}>
          <MdOutlineAccountCircle size={22} aria-hidden />
          <h2 className="sec-name">{user ? "Signed in" : "Sign in or create an account"}</h2>
        </div>
        <div className={styles.body}>
          {user === undefined || user ? (
            current === null ? (
              <p className="s-body error-text" role="alert">
                Couldn&apos;t load your profile. Please refresh to try again.
              </p>
            ) : (
              <p className="s-body">Loading…</p>
            )
          ) : (
            <SignInForm returnTo={returnTo} />
          )}
        </div>
      </section>
    </Shell>
  );
}

// Signed-out and setup states: the plain account page.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PaperTexture color="var(--ocean)">
      <SiteHeader />
      <main className={styles.main}>
        <div className="tk-eyebrow ink-soft">ACCOUNT</div>
        <h1 className={styles.title}>Your whereabout</h1>
        {children}
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}

function SignedInFooter({ email, profile }: { email: string; profile: Profile }) {
  const [busy, setBusy] = useState(false);
  return (
    <p className={`src-row ${own.footRow}`}>
      <span>Signed in as {email}</span>
      <span>{profile.visibility === "private" ? "Visible to: you and companions" : "Visible to: anyone with your link"}</span>
      <button
        type="button"
        className={`src-row ${own.textButton}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await signOut();
          track("sign-out");
          setBusy(false);
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </p>
  );
}

// Set by a country page's VISITED / INTERESTED tags when signed out.
const returnPathFromUrl = () => safeReturnPath(new URLSearchParams(window.location.search).get("next"));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Supabase's code length is a project setting (6–10 digits).
const CODE = /^\d{6,10}$/;

// Two steps: email, then the code from the email. Client-only (after the session check), so window exists.
function SignInForm({ returnTo }: { returnTo: string | null }) {
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
    // The panel takes over from here: setup for new accounts, then back to returnTo.
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
