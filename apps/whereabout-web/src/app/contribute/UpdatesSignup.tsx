"use client";

import { useState } from "react";
import { MdOutlineMarkEmailUnread } from "react-icons/md";
import { saveEmail, subscribeToUpdates } from "@/lib/contribute";
import form from "@/components/country/ContributeForm.module.css";
import styles from "./Contribute.module.css";

// Email-updates sign-up card. Stored in update_subscribers; nothing is sent yet.
export default function UpdatesSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && status === "idle";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setStatus("sending");
    setError(null);
    const err = await subscribeToUpdates(email.trim(), website);
    if (err) {
      setError(err);
      setStatus("idle");
      return;
    }
    saveEmail(email.trim());
    setStatus("sent");
  }

  return (
    <section className={styles.option}>
      <div className={`${styles.head} ${styles.inkHead}`}>
        <MdOutlineMarkEmailUnread size={22} aria-hidden />
        <h2 className="sec-name">Get updates</h2>
      </div>
      <div className={styles.body}>
        {status === "sent" ? (
          <p className="s-body">You&apos;re on the list. Thanks for following along!</p>
        ) : (
          <form onSubmit={submit} noValidate className={styles.stack}>
            <label htmlFor="updates-email" className="s-body">
              Please submit your email if you would like to receive updates about whereabout.
            </label>
            <div className={form.inline}>
              <input
                id="updates-email"
                className={form.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                required
              />
              <button
                type="submit"
                className={form.submit}
                disabled={!ready}
              >
                {status === "sending" ? "SENDING…" : "SIGN UP"}
              </button>
            </div>
            {/* Honeypot: hidden from people, filled by bots. */}
            <input
              className={form.trap}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <span className="src-row">Only used for occasional updates about whereabout.</span>
            {error && (
              <p className="s-body error-text" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
