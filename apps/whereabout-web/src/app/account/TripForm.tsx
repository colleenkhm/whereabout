"use client";

import { useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import form from "@/components/country/ContributeForm.module.css";
import { track } from "@/lib/analytics";
import { deleteTrip, removeTripPhoto, saveTrip, TRIP_NAME_MAX, uploadTripPhoto, type Trip } from "@/lib/trips";
import type { CountrySummary } from "@/lib/types";
import CountrySearch from "../CountrySearch";
import own from "./Account.module.css";
import styles from "./Profile.module.css";

// Add or edit a trip in the sheet. A picked photo uploads after the trip saves.
export default function TripForm({
  userId,
  trip,
  countries,
  onDone,
}: {
  userId: string;
  trip?: Trip;
  countries: CountrySummary[];
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(trip?.countryIds ?? []);
  const [start, setStart] = useState(trip?.startDate ?? "");
  const [end, setEnd] = useState(trip?.endDate ?? "");
  const [name, setName] = useState(trip?.name ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [dropPhoto, setDropPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const names = new Map(countries.map((c) => [c.isoCode, c.nameCommon]));
  const endBeforeStart = end !== "" && start !== "" && end < start;
  const canSave = picked.length > 0 && start !== "" && !endBeforeStart && !busy;
  const hasPhoto = !!photo || (!!trip?.photoPath && !dropPhoto);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    const draft = { name: name.trim() || null, startDate: start, endDate: end || null, countryIds: picked };
    const id = await saveTrip(userId, draft, trip?.id);
    if (!id) {
      setBusy(false);
      return setError("Couldn't save this trip. Please try again.");
    }
    track(trip ? "trip-edit" : "trip-add");
    const current = { id, photoPath: trip?.photoPath ?? null };
    if (photo) {
      const result = await uploadTripPhoto(userId, current, photo);
      if ("error" in result) {
        setBusy(false);
        // The trip itself saved; say so.
        return setError(`Trip saved, but: ${result.error}`);
      }
    } else if (dropPhoto && !(await removeTripPhoto(current))) {
      setBusy(false);
      return setError("Trip saved, but couldn't remove the photo. Please try again.");
    }
    setBusy(false);
    onDone();
  }

  async function remove() {
    if (!trip) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    const ok = await deleteTrip(trip);
    setBusy(false);
    if (!ok) return setError("Couldn't delete this trip. Please try again.");
    track("trip-delete");
    onDone();
  }

  return (
    <form onSubmit={save} noValidate className={styles.sheetBody}>
      <div className={styles.field}>
        <span className="s-body">
          <b>Where?</b> Add every country on the trip, in order.
        </span>
        <CountrySearch
          countries={countries.filter((c) => !picked.includes(c.isoCode))}
          onSelect={(c) => setPicked([...picked, c.isoCode])}
        />
        {picked.length > 0 && (
          <ul className={own.countries}>
            {picked.map((iso) => (
              <li key={iso}>
                <button
                  type="button"
                  className={`s-body ${own.country} ${own.removable}`}
                  onClick={() => setPicked(picked.filter((p) => p !== iso))}
                  aria-label={`Remove ${names.get(iso) ?? iso}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`} alt="" width={20} height={14} className={own.flag} />
                  {names.get(iso) ?? iso}
                  <MdClose size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.dates}>
        <label className={styles.field}>
          <span className="s-body">
            <b>Start</b>
          </span>
          <input type="date" className={form.input} value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span className="s-body">
            <b>End</b> (optional)
          </span>
          <input type="date" className={form.input} value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      {endBeforeStart && <span className="src-row error-text">The end date is before the start.</span>}

      <label className={styles.field}>
        <span className="s-body">
          <b>Name</b> (optional)
        </span>
        <input
          className={form.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={TRIP_NAME_MAX}
          placeholder="Honeymoon, Spring break…"
        />
      </label>

      <div className={styles.field}>
        <span className="s-body">
          <b>Photo</b> (optional)
          {photo && <> · {photo.name}</>}
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            setPhoto(e.target.files?.[0] ?? null);
            setDropPhoto(false);
            e.target.value = "";
          }}
        />
        <div className={own.actions}>
          <button type="button" className={`${form.submit} ${styles.small}`} disabled={busy} onClick={() => input.current?.click()}>
            {hasPhoto ? "CHANGE PHOTO" : "CHOOSE PHOTO"}
          </button>
          {hasPhoto && (
            <button
              type="button"
              className={`src-row ${own.textButton}`}
              disabled={busy}
              onClick={() => {
                setPhoto(null);
                setDropPhoto(true);
              }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <span className="src-row">Trips that have started mark their countries as visited.</span>

      {error && (
        <p className="s-body error-text" role="alert">
          {error}
        </p>
      )}

      <div className={own.actions}>
        <button type="submit" className={form.submit} disabled={!canSave}>
          {busy ? "SAVING…" : "SAVE TRIP"}
        </button>
        {trip && (
          <button type="button" className={`src-row ${own.textButton} ${own.back}`} disabled={busy} onClick={remove}>
            {confirmDelete ? "Tap again to delete" : "Delete trip"}
          </button>
        )}
      </div>
    </form>
  );
}
