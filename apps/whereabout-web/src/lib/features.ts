// Build-time feature flags. Off unless the build env sets them to "true".
// Read process.env.NEXT_PUBLIC_* literally so Next.js inlines them.
export const features = {
  // Dev/staging only until accounts ship.
  accounts: process.env.NEXT_PUBLIC_FEATURE_ACCOUNTS === "true",
} as const;
