"use client";

import dynamic from "next/dynamic";

// The only entry points to accounts UI. Flag-off builds drop these imports, auth client included.
// Literal env check (mirrors features.accounts): the bundler can't fold an imported object's property.
const on = process.env.NEXT_PUBLIC_FEATURE_ACCOUNTS === "true";
const Off = () => null;

export const AccountLink = on ? dynamic(() => import("./AccountLink")) : Off;
export const AccountPanel = on ? dynamic(() => import("@/app/account/AccountPanel")) : Off;
export const CountryMarks = on ? dynamic(() => import("./country/CountryMarks")) : Off;
