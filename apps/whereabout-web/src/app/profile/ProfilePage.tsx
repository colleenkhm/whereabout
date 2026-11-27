"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/auth";
import type { CountrySummary } from "@/lib/types";
import ProfileView from "../account/ProfileView";

interface Props {
  countries: CountrySummary[];
  postcardColors: Record<string, string[]>;
}

// Static export: the id comes from the query string. Suspense for prerendering.
export default function ProfilePage(props: Props) {
  return (
    <Suspense>
      <ByQuery {...props} />
    </Suspense>
  );
}

function ByQuery({ countries, postcardColors }: Props) {
  const id = useSearchParams().get("u") ?? "";
  const user = useUser();
  // Wait for the session so the first fetch already knows the viewer.
  if (user === undefined) return null;
  return <ProfileView key={id} profileId={id} viewer={user} countries={countries} postcardColors={postcardColors} />;
}
