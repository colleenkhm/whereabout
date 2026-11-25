"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tagClass, type TagVariant } from "./linkTags";

// "Get involved" tag (links to /contribute). Variant matches the bar it sits on; see linkTags.
// Hidden on /contribute itself.
export default function ContributeLink({ variant = "outline" }: { variant?: TagVariant }) {
  if (usePathname()?.replace(/\/$/, "") === "/contribute") return null;
  return (
    <Link href="/contribute" className={tagClass(variant)} data-umami-event="get-involved">
      GET INVOLVED
    </Link>
  );
}
