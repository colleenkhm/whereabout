"use client";

import { useEffect, useRef, useState } from "react";
import { MdClose, MdOutlineBadge } from "react-icons/md";
import form from "@/components/country/ContributeForm.module.css";
import { track } from "@/lib/analytics";
import { fetchAllMarks, saveMarks, type MarkKind } from "@/lib/countryMarks";
import { NAME_MAX, removeAvatar, updateProfile, uploadAvatar, type Profile, type Visibility } from "@/lib/profile";
import type { CountrySummary } from "@/lib/types";
import CountrySearch from "../CountrySearch";
import styles from "../contribute/Contribute.module.css";
import own from "./Account.module.css";
import { Avatar, useAvatarUrl } from "./Avatar";

const STEPS = ["name", "privacy", "photo", "visited", "interested"] as const;
type Step = (typeof STEPS)[number];

const VISIBILITY: { value: Visibility; label: string; hint: string }[] = [
  { value: "private", label: "Only me", hint: "Your profile and countries stay private." },
  {
    value: "link",
    label: "Anyone with my link",
    hint: "When shareable profiles arrive, people you send your link to can see your name, photo and countries.",
  },
];

const COUNTRY_STEPS: Record<"visited" | "interested", { title: string; intro: string }> = {
  visited: {
    title: "Where have you been?",
    intro: "Add places you've visited. You can add more, and details about each trip, later.",
  },
  interested: {
    title: "Where do you want to go?",
    intro: "Add places you're interested in visiting.",
  },
};

// After sign-up (or from Edit profile): name, privacy, photo, then countries. Each step saves on Continue.
export default function ProfileSetup({
  userId,
  profile,
  countries,
  onDone,
}: {
  userId: string;
  profile: Profile;
  countries: CountrySummary[];
  onDone: (profile: Profile) => void;
}) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(profile.displayName ?? "");
  const [visibility, setVisibility] = useState<Visibility>(profile.visibility);
  const [avatarPath, setAvatarPath] = useState(profile.avatarPath);
  // Saved marks, and the in-progress picks for each kind.
  const [saved, setSaved] = useState<Record<MarkKind, Set<string>> | null>(null);
  const [picked, setPicked] = useState<Record<MarkKind, Set<string>>>({ visited: new Set(), interested: new Set() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing users (or Edit profile) may already have marks.
  useEffect(() => {
    fetchAllMarks().then((marks) => {
      const byKind = (k: MarkKind) => new Set((marks ?? []).filter((m) => m.kind === k).map((m) => m.isoCode));
      const initial = { visited: byKind("visited"), interested: byKind("interested") };
      setSaved(initial);
      setPicked({ visited: new Set(initial.visited), interested: new Set(initial.interested) });
    });
  }, []);

  const index = STEPS.indexOf(step);
  const isLast = index === STEPS.length - 1;
  const trimmed = name.trim();

  function go(delta: number) {
    setError(null);
    setStep(STEPS[index + delta]);
  }

  async function finish() {
    const completedAt = profile.completedAt ?? new Date().toISOString();
    if (!profile.completedAt && !(await updateProfile(userId, { profile_completed_at: completedAt }))) return false;
    if (!profile.completedAt) track("profile-completed");
    onDone({ displayName: trimmed, visibility, avatarPath, completedAt });
    return true;
  }

  // Saves the current step, then moves on.
  async function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    let ok = true;
    if (step === "name") ok = await updateProfile(userId, { display_name: trimmed });
    else if (step === "privacy") ok = await updateProfile(userId, { visibility });
    else if ((step === "visited" || step === "interested") && saved) {
      ok = await saveMarks(userId, step, saved[step], picked[step]);
      if (ok) setSaved({ ...saved, [step]: new Set(picked[step]) });
    }
    if (ok && isLast) ok = await finish();
    setBusy(false);
    if (!ok) setError("Couldn't save. Please try again.");
    else if (!isLast) go(1);
  }

  async function skip() {
    if (busy) return;
    // Skipping drops unsaved picks.
    if ((step === "visited" || step === "interested") && saved) {
      setPicked({ ...picked, [step]: new Set(saved[step]) });
    }
    if (!isLast) return go(1);
    setBusy(true);
    const ok = await finish();
    setBusy(false);
    if (!ok) setError("Couldn't save. Please try again.");
  }

  const optional = step === "photo" || step === "visited" || step === "interested";
  const canContinue = step === "name" ? trimmed.length > 0 : step === "visited" || step === "interested" ? saved !== null : true;

  return (
    <section className={styles.option}>
      <div className={`${styles.head} ${styles.inkHead}`}>
        <MdOutlineBadge size={22} aria-hidden />
        <h2 className="sec-name">{profile.completedAt ? "Edit your profile" : "Set up your profile"}</h2>
        <span className={`tk-eyebrow ${own.stepCount}`}>
          {index + 1} / {STEPS.length}
        </span>
      </div>
      <form onSubmit={next} noValidate className={styles.body}>
        {step === "name" && (
          <>
            <label htmlFor="profile-name" className="s-body">
              <b>What&apos;s your name?</b>
            </label>
            <input
              id="profile-name"
              className={form.input}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="Your name"
              autoFocus
              required
            />
          </>
        )}

        {step === "privacy" && (
          <fieldset className={own.fieldset}>
            <legend className="s-body">
              <b>Who can see your profile?</b>
            </legend>
            {VISIBILITY.map((v) => (
              <label key={v.value} className={form.check}>
                <input
                  type="radio"
                  name="visibility"
                  value={v.value}
                  checked={visibility === v.value}
                  onChange={() => setVisibility(v.value)}
                />
                <span className="s-body">
                  <b>{v.label}</b>
                  <br />
                  {v.hint}
                </span>
              </label>
            ))}
            <span className="src-row">Profiles aren&apos;t shared anywhere yet. Change this any time.</span>
          </fieldset>
        )}

        {step === "photo" && (
          <PhotoStep userId={userId} path={avatarPath} onChange={setAvatarPath} busy={busy} setBusy={setBusy} setError={setError} />
        )}

        {(step === "visited" || step === "interested") && (
          <CountriesStep
            title={COUNTRY_STEPS[step].title}
            intro={COUNTRY_STEPS[step].intro}
            countries={countries}
            picked={picked[step]}
            onChange={(s) => setPicked({ ...picked, [step]: s })}
          />
        )}

        {error && (
          <p className="s-body error-text" role="alert">
            {error}
          </p>
        )}

        <div className={own.actions}>
          <button type="submit" className={form.submit} disabled={!canContinue || busy}>
            {busy ? "SAVING…" : isLast ? "FINISH" : "CONTINUE"}
          </button>
          {optional && (
            <button type="button" className={`src-row ${own.textButton}`} onClick={skip} disabled={busy}>
              Skip
            </button>
          )}
          {index > 0 && (
            <button type="button" className={`src-row ${own.textButton} ${own.back}`} onClick={() => go(-1)} disabled={busy}>
              Back
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function PhotoStep({
  userId,
  path,
  onChange,
  busy,
  setBusy,
  setError,
}: {
  userId: string;
  path: string | null;
  onChange: (path: string | null) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
}) {
  const url = useAvatarUrl(path);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await uploadAvatar(userId, file);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else onChange(result.path);
  }

  async function remove() {
    if (!path) return;
    setBusy(true);
    setError(null);
    const ok = await removeAvatar(userId, path);
    setBusy(false);
    if (ok) onChange(null);
    else setError("Couldn't remove your photo. Please try again.");
  }

  return (
    <>
      <p className="s-body">
        <b>Add a profile picture</b>
      </p>
      <div className={own.photoRow}>
        <Avatar url={url} size={88} />
        <div className={own.photoActions}>
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button type="button" className={form.submit} disabled={busy} onClick={() => input.current?.click()}>
            {path ? "CHANGE PHOTO" : "CHOOSE PHOTO"}
          </button>
          {path && (
            <button type="button" className={`src-row ${own.textButton}`} disabled={busy} onClick={remove}>
              Remove photo
            </button>
          )}
        </div>
      </div>
      <span className="src-row">Can be added or changed later.</span>
    </>
  );
}

function CountriesStep({
  title,
  intro,
  countries,
  picked,
  onChange,
}: {
  title: string;
  intro: string;
  countries: CountrySummary[];
  picked: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const chosen = countries.filter((c) => picked.has(c.isoCode));
  const rest = countries.filter((c) => !picked.has(c.isoCode));
  const toggle = (iso: string, on: boolean) => {
    const s = new Set(picked);
    if (on) s.add(iso);
    else s.delete(iso);
    onChange(s);
  };

  return (
    <>
      <p className="s-body">
        <b>{title}</b>
        <br />
        {intro}
      </p>
      <CountrySearch countries={rest} onSelect={(c) => toggle(c.isoCode, true)} />
      {chosen.length > 0 && (
        <ul className={own.countries}>
          {chosen.map((c) => (
            <li key={c.isoCode}>
              <button
                type="button"
                className={`s-body ${own.country} ${own.removable}`}
                onClick={() => toggle(c.isoCode, false)}
                aria-label={`Remove ${c.nameCommon}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${c.isoCode.toLowerCase()}.png`}
                  alt=""
                  width={20}
                  height={14}
                  className={own.flag}
                />
                {c.nameCommon}
                <MdClose size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
