"use client";

import { authClient } from "./auth";

// Own profile row (RLS) and photo in the private avatars bucket.
export type Visibility = "private" | "link";

export interface Profile {
  displayName: string | null;
  visibility: Visibility;
  avatarPath: string | null;
  completedAt: string | null;
}

export const NAME_MAX = 80;

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await authClient()
    .from("profiles")
    .select("display_name, visibility, avatar_path, profile_completed_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    displayName: data.display_name,
    visibility: data.visibility as Visibility,
    avatarPath: data.avatar_path,
    completedAt: data.profile_completed_at,
  };
}

type ProfilePatch = Partial<{
  display_name: string;
  visibility: Visibility;
  avatar_path: string | null;
  profile_completed_at: string;
}>;

// Returns false on failure.
export async function updateProfile(userId: string, patch: ProfilePatch): Promise<boolean> {
  const { error } = await authClient().from("profiles").update(patch).eq("id", userId);
  return !error;
}

const AVATAR_SIZE = 320;

// Center-cropped square JPEG, so uploads stay small whatever the phone shoots.
async function toSquareJpeg(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null;
  }
}

// Uploads and saves the path. Returns the new path, or an error message.
export async function uploadAvatar(userId: string, file: File): Promise<{ path: string } | { error: string }> {
  const blob = await toSquareJpeg(file);
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

export async function avatarUrl(path: string): Promise<string | null> {
  const { data, error } = await authClient().storage.from("avatars").createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
