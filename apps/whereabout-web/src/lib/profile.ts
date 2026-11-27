"use client";

import { authClient } from "./auth";
import { croppedJpeg, signedUrl } from "./images";
import type { ThemeId } from "./themes";

// Own profile row (RLS) and photo in the private avatars bucket.
export type Visibility = "private" | "link";

export interface Profile {
  displayName: string | null;
  visibility: Visibility;
  avatarPath: string | null;
  completedAt: string | null;
  homeBase: string | null;
  theme: ThemeId;
}

export const NAME_MAX = 80;
export const HOME_BASE_MAX = 80;

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await authClient()
    .from("profiles")
    .select("display_name, visibility, avatar_path, profile_completed_at, home_base, theme")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    displayName: data.display_name,
    visibility: data.visibility as Visibility,
    avatarPath: data.avatar_path,
    completedAt: data.profile_completed_at,
    homeBase: data.home_base,
    theme: data.theme as ThemeId,
  };
}

type ProfilePatch = Partial<{
  display_name: string;
  visibility: Visibility;
  avatar_path: string | null;
  profile_completed_at: string;
  home_base: string | null;
  theme: ThemeId;
}>;

// Returns false on failure.
export async function updateProfile(userId: string, patch: ProfilePatch): Promise<boolean> {
  const { error } = await authClient().from("profiles").update(patch).eq("id", userId);
  return !error;
}

const AVATAR_SIZE = 320;

// Uploads and saves the path. Returns the new path, or an error message.
export async function uploadAvatar(userId: string, file: File): Promise<{ path: string } | { error: string }> {
  const blob = await croppedJpeg(file, AVATAR_SIZE, AVATAR_SIZE);
  if (!blob) return { error: "Couldn't read that image. Try a JPEG or PNG." };
  // New name each time, so cached signed URLs never show the old photo.
  const path = `${userId}/${Date.now()}.jpg`;
  const storage = authClient().storage.from("avatars");
  const { error } = await storage.upload(path, blob, { contentType: "image/jpeg" });
  if (error) return { error: "Couldn't upload your photo. Please try again." };
  const previous = (await fetchProfile(userId))?.avatarPath;
  if (!(await updateProfile(userId, { avatar_path: path }))) {
    await storage.remove([path]);
    return { error: "Couldn't save your photo. Please try again." };
  }
  if (previous && previous !== path) await storage.remove([previous]);
  return { path };
}

export async function removeAvatar(userId: string, path: string): Promise<boolean> {
  if (!(await updateProfile(userId, { avatar_path: null }))) return false;
  await authClient().storage.from("avatars").remove([path]);
  return true;
}

export const avatarUrl = (path: string) => signedUrl("avatars", path);

// Someone's profile as the viewer may see it (get_profile RPC). Null fields when hidden.
export type Relationship = "self" | "friends" | "requested" | "incoming" | "none" | "anon";

export interface PublicProfile {
  id: string;
  displayName: string | null;
  homeBase: string | null;
  avatarPath: string | null;
  theme: ThemeId;
  visitedCount: number | null;
  tripCount: number | null;
  friendCount: number | null;
  relationship: Relationship;
  canView: boolean;
}

// undefined: no such (finished) profile. null: request failed.
export async function fetchPublicProfile(id: string): Promise<PublicProfile | null | undefined> {
  const { data, error } = await authClient().rpc("get_profile", { p_id: id });
  if (error) return error.code === "22P02" ? undefined : null; // bad uuid
  const r = data?.[0];
  if (!r) return undefined;
  return {
    id: r.id,
    displayName: r.display_name,
    homeBase: r.home_base,
    avatarPath: r.avatar_path,
    theme: r.theme as ThemeId,
    visitedCount: r.visited_count,
    tripCount: r.trip_count,
    friendCount: r.friend_count,
    relationship: r.relationship as Relationship,
    canView: r.can_view,
  };
}

// Share / invite link. Profile pages read ?u= on the client (static export).
export const profileHref = (id: string) => `/profile?u=${id}`;
