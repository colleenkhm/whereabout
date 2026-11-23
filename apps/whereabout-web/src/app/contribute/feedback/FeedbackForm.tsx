"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import ContributeForm from "@/components/country/ContributeForm";
import { FEEDBACK_SECTION } from "@/lib/contribute";

// Logo green, matching the Contribute card header.
const COLORS = { tint: "#017b40", textColor: "#fff", accentOnWhite: "#017b40" };

const noopSubscribe = () => () => {};

export default function FeedbackForm() {
  const router = useRouter();
  // Client-only: the form reads the saved email from localStorage on first render.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;
  return (
    <ContributeForm
      kind="add"
      section={FEEDBACK_SECTION}
      countryIso=""
      countryName=""
      colors={COLORS}
      onDone={() => router.push("/contribute")}
    />
  );
}
