"use client";

import { useEffect, useState } from "react";
import { avatarUrl } from "@/lib/profile";
import own from "./Account.module.css";

// Signed URL for a stored photo; null while loading or with no photo.
export function useAvatarUrl(path: string | null): string | null {
  const [url, setUrl] = useState<{ path: string; url: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    avatarUrl(path).then((u) => live && u && setUrl({ path, url: u }));
    return () => {
      live = false;
    };
  }, [path]);
  return path && url?.path === path ? url.url : null;
}

export function Avatar({ url, size }: { url: string | null; size: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} className={own.avatar} />
  ) : (
    <span className={`${own.avatar} ${own.avatarEmpty}`} style={{ width: size, height: size }} aria-hidden />
  );
}
