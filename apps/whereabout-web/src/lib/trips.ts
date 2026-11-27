"use client";

import { authClient } from "./auth";
import { croppedJpeg, signedUrl } from "./images";

// Trips (#96). Own rows via RLS; anyone's via get_profile_trips, which checks visibility.
export interface Trip {
  id: string;
  name: string | null;
  startDate: string; // yyyy-mm-dd
  endDate: string | null;
  photoPath: string | null;
  countryIds: string[];
}

export interface TripDraft {
  name: string | null;
  startDate: string;
  endDate: string | null;
  countryIds: string[];
}

export const TRIP_NAME_MAX = 80;

export async function fetchTrips(ownerId: string): Promise<Trip[] | null> {
  const { data, error } = await authClient().rpc("get_profile_trips", { p_id: ownerId });
  if (error) return null;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string | null,
    startDate: r.start_date as string,
    endDate: r.end_date as string | null,
    photoPath: r.photo_path as string | null,
    countryIds: r.country_ids as string[],
  }));
}

const tripRow = (ownerId: string, d: TripDraft) => ({
  owner_id: ownerId,
  name: d.name,
  start_date: d.startDate,
  end_date: d.endDate,
});

// Countries are replaced wholesale; order is the order picked. Returns the trip id, or null.
export async function saveTrip(ownerId: string, draft: TripDraft, id?: string): Promise<string | null> {
  const db = authClient();
  let tripId = id;
  if (tripId) {
    const { error } = await db.from("trips").update(tripRow(ownerId, draft)).eq("id", tripId);
    if (error) return null;
    const { error: delError } = await db.from("trip_countries").delete().eq("trip_id", tripId);
    if (delError) return null;
  } else {
    const { data, error } = await db.from("trips").insert(tripRow(ownerId, draft)).select("id").single();
    if (error || !data) return null;
    tripId = data.id as string;
  }
  const rows = draft.countryIds.map((country_id, sort_order) => ({ trip_id: tripId, country_id, sort_order }));
  const { error } = await db.from("trip_countries").insert(rows);
  return error ? null : tripId!;
}

export async function deleteTrip(trip: Trip): Promise<boolean> {
  const db = authClient();
  const { error } = await db.from("trips").delete().eq("id", trip.id);
  if (error) return false;
  if (trip.photoPath) await db.storage.from("trip-photos").remove([trip.photoPath]);
  return true;
}

// Postcard shape, 3:2.
const PHOTO_W = 900;
const PHOTO_H = 600;

// Uploads, saves the path, and removes the old photo. Returns the new path, or an error message.
export async function uploadTripPhoto(
  ownerId: string,
  trip: Pick<Trip, "id" | "photoPath">,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const blob = await croppedJpeg(file, PHOTO_W, PHOTO_H);
  if (!blob) return { error: "Couldn't read that image. Try a JPEG or PNG." };
  const path = `${ownerId}/${trip.id}/${Date.now()}.jpg`;
  const db = authClient();
  const storage = db.storage.from("trip-photos");
  const { error } = await storage.upload(path, blob, { contentType: "image/jpeg" });
  if (error) return { error: "Couldn't upload your photo. Please try again." };
  const { error: saveError } = await db.from("trips").update({ photo_path: path }).eq("id", trip.id);
  if (saveError) {
    await storage.remove([path]);
    return { error: "Couldn't save your photo. Please try again." };
  }
  if (trip.photoPath) await storage.remove([trip.photoPath]);
  return { path };
}

export async function removeTripPhoto(trip: Pick<Trip, "id" | "photoPath">): Promise<boolean> {
  if (!trip.photoPath) return true;
  const db = authClient();
  const { error } = await db.from("trips").update({ photo_path: null }).eq("id", trip.id);
  if (error) return false;
  await db.storage.from("trip-photos").remove([trip.photoPath]);
  return true;
}

export const tripPhotoUrl = (path: string) => signedUrl("trip-photos", path);
