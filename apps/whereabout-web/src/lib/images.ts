"use client";

import { authClient } from "./auth";

// Center-cropped JPEG at a fixed size, so uploads stay small whatever the phone shoots.
export async function croppedJpeg(file: File, width: number, height: number): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(bitmap.width / width, bitmap.height / height);
    const sw = width * scale;
    const sh = height * scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null;
  }
}

// Signed URL for a private-bucket object; null on failure.
export async function signedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await authClient().storage.from(bucket).createSignedUrl(path, 60 * 60);
  return error || !data ? null : data.signedUrl;
}
