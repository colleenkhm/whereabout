"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth";
import { tagClass, type TagVariant } from "./linkTags";

// Sign in / Account tag (links to /account). Hidden on /account itself.
// Import via AccountsGate so flag-off builds drop it.
export default function AccountLink({ variant = "outline" }: { variant?: TagVariant }) {
  const user = useUser();
  if (usePathname()?.replace(/\/$/, "") === "/account") return null;
  return (
    <Link href="/account" className={tagClass(variant)}>
      {user ? "ACCOUNT" : "SIGN IN"}
    </Link>
  );
}
