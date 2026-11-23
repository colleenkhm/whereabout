"use client";

import { useId, useState } from "react";
import type { SectionColors } from "@/lib/color";
import {
  CITY_CATEGORIES,
  FEEDBACK_SECTION,
  OTHER_SECTION,
  loadEmail,
  saveEmail,
  submitContribution,
  type ContributeKind,
} from "@/lib/contribute";
import type { City } from "@/lib/types";
import CitiesSection from "./CitiesSection";
import styles from "./ContributeForm.module.css";

const PROMPTS: Record<ContributeKind, { label: string; placeholder: string }> = {
  add: { label: "WHAT SHOULD WE ADD?", placeholder: "In your own words, briefly." },
  dispute: { label: "WHAT'S WRONG?", placeholder: "What's incorrect or out of date, in your own words." },
};

// Sheet body in contribute mode: an empty box in place of the section's info.
// Cities: pick or name a city first, then the form.
export default function ContributeForm({
  kind,
  section,
  countryIso,
  countryName,
  cities,
  capital,
  current,
  colors,
  onDone,
}: {
  kind: ContributeKind;
  section: string;
  countryIso: string;
  countryName: string;
  cities?: City[];
  capital?: string | null;
  // Dispute: the section's current info, shown above the form.
  current?: React.ReactNode;
  colors: SectionColors;
  onDone: () => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [why, setWhy] = useState("");
  const [tips, setTips] = useState("");
  const [source, setSource] = useState("");
  // Client-only: the sheet body never prerenders.
  const [email, setEmail] = useState(loadEmail);
  const [certified, setCertified] = useState(false);
  const [linkAccount, setLinkAccount] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [city, setCity] = useState("");
  const [newCity, setNewCity] = useState("");
  const [category, setCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const feedback = section === FEEDBACK_SECTION;
  const other = section === OTHER_SECTION || feedback;
  const withTips = kind === "add" && !other;
  const prompt = feedback
    ? { label: "WHAT'S YOUR FEEDBACK?", placeholder: "Ideas, bugs, anything about whereabout as a whole." }
    : other
      ? { label: "WHAT'S ON YOUR MIND?", placeholder: "Anything to add or correct that doesn't fit the other tickets." }
      : PROMPTS[kind];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const ready = text.trim() !== "" && emailOk && certified && status === "idle";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setStatus("sending");
    setError(null);
    const err = await submitContribution({
      countryIso,
      countryName,
      section,
      text,
      why: cities ? why : undefined,
      tips: withTips ? tips : "",
      source,
      email: email.trim(),
      certified,
      linkAccount,
      wantsUpdates,
      city: cities ? city : undefined,
      category: cities ? category : undefined,
      website,
    });
    if (err) {
      setError(err);
      setStatus("idle");
      return;
    }
    saveEmail(email.trim());
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className={styles.form}>
        <p className="s-head">Thank you!</p>
        <p className="s-body">
          {feedback
            ? "Your feedback is in. Every note is read by hand."
            : `${other ? "Your note" : kind === "add" ? "Your addition" : "Your dispute"} is in. Everything is checked by hand before the page changes.`}
        </p>
        <button type="button" className={styles.submit} style={button(colors)} onClick={onDone}>
          BACK TO {feedback ? "GET INVOLVED" : countryName.toUpperCase()}
        </button>
      </div>
    );
  }

  const form = (
    <form className={styles.form} onSubmit={submit} noValidate>
      {cities && (
        <>
          <div className={styles.chosen}>
            <span className="s-label">CITY</span>
            <span className="row-title">{city}</span>
            <button type="button" className={styles.change} onClick={() => setCity("")}>
              CHANGE
            </button>
          </div>
          <Field id={`${id}-cat`} label="WHAT ARE YOU ADDING?">
            <select id={`${id}-cat`} className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose one</option>
              {CITY_CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field id={`${id}-text`} label={prompt.label}>
        <textarea
          id={`${id}-text`}
          className={`${styles.input} ${styles.area}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={prompt.placeholder}
          maxLength={4000}
          rows={5}
          required
        />
      </Field>

      {cities && (
        <Field id={`${id}-why`} label="WHY RECOMMENDED?" optional>
          <textarea
            id={`${id}-why`}
            className={styles.input}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="What makes it worth a traveler's time"
            maxLength={4000}
            rows={3}
          />
        </Field>
      )}

      {withTips && (
        <Field id={`${id}-tips`} label="TIPS & THINGS TO KNOW" optional>
          <textarea
            id={`${id}-tips`}
            className={styles.input}
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            placeholder="A quick review, tips and tricks, anything worth knowing before you go"
            maxLength={4000}
            rows={4}
          />
        </Field>
      )}

      <Field id={`${id}-src`} label="SOURCE" optional>
        <textarea
          id={`${id}-src`}
          className={styles.input}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="A link, or where you saw or heard it"
          maxLength={1000}
          rows={2}
        />
      </Field>

      <Field id={`${id}-email`} label="EMAIL">
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={254}
          required
        />
        <span className={`src-row ${styles.hint}`}>Only used if we need to follow up on this.</span>
      </Field>

      {/* Honeypot: hidden from people, filled by bots. */}
      <input
        className={styles.trap}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      <label className={styles.check}>
        <input type="checkbox" checked={wantsUpdates} onChange={(e) => setWantsUpdates(e.target.checked)} />
        <span className="s-body">Email me occasional updates about whereabout.</span>
      </label>

      <label className={styles.check}>
        <input type="checkbox" checked={linkAccount} onChange={(e) => setLinkAccount(e.target.checked)} />
        <span className="s-body">Accounts are coming. Link this information to my account if/when I create one.</span>
      </label>

      <label className={styles.check}>
        <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
        <span className="s-body">I certify that the information I submit is true to the best of my knowledge.</span>
      </label>

      {error && (
        <p className="s-body" role="alert" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <button type="submit" className={styles.submit} style={button(colors)} disabled={!ready}>
        {status === "sending" ? "SENDING…" : other ? "SUBMIT" : kind === "add" ? "SUBMIT ADDITION" : "SUBMIT DISPUTE"}
      </button>
    </form>
  );
  if (cities && !city) {
    return (
      <>
        <p className={`s-label ${styles.step}`}>WHICH CITY WOULD YOU LIKE TO ADD INFORMATION FOR?</p>
        {cities.length > 0 && (
          <CitiesSection cities={cities} capital={capital ?? null} accent={colors.accentOnWhite} onPick={setCity} />
        )}
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (newCity.trim()) setCity(newCity.trim());
          }}
        >
          <Field id={`${id}-city`} label={cities.length > 0 ? "OR ADD A CITY" : "ADD A CITY"}>
            <div className={styles.inline}>
              <input
                id={`${id}-city`}
                className={styles.input}
                list={`${id}-cities`}
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="City name"
                maxLength={120}
              />
              <datalist id={`${id}-cities`}>
                {cities.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <button type="submit" className={styles.submit} style={button(colors)} disabled={!newCity.trim()}>
                NEXT
              </button>
            </div>
          </Field>
        </form>
      </>
    );
  }
  if (!current) return form;
  return (
    <>
      {current}
      <div className={styles.divider}>
        <span className="tk-eyebrow">SOMETHING WRONG HERE?</span>
      </div>
      {form}
    </>
  );
}

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className="s-label">
        {label}
        {optional && <span className={styles.optional}> · OPTIONAL</span>}
      </label>
      {children}
    </div>
  );
}

const button = (c: SectionColors) => ({ background: c.tint, color: c.textColor });
