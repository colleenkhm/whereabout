# whereabout

*Making the foreign familiar.*

A hand-curated travel database, with a Flutter app as its reader.

## Development workflow

| Branch | Deploys to | Supabase |
| --- | --- | --- |
| `main` | www.whereabout.world (GitHub Pages) | prod |
| `dev` | Cloudflare Worker `whereabout-staging` (`wrangler.jsonc`) | dev |
| `feature/*` | nowhere (run locally) | dev |

### Each feature

1. Branch off `dev`: `git switch dev && git pull && git switch -c feature/<name>`.
2. If users will see the change, add its line under `## [Unreleased]` in
   `CHANGELOG.md` in the same PR. If it's merged but not in the app yet
   (data imported, no UI), say so in the line. Refactors, docs, and CI get
   no line.
3. Open a PR into `dev`. CI runs `flutter analyze` and `flutter test`.
4. Merging into `dev` deploys staging. Click around there.

### Each release

A release is a PR from `dev` into `main` with a version bump and a
CHANGELOG entry.

1. On `dev`, up to date and clean, run `/release` in Claude Code. It
   proposes the version (minor for new features, patch for fixes) and the
   CHANGELOG entry. Lines marked "not in the app yet" stay under
   `[Unreleased]`. After approval it edits `pubspec.yaml` and `CHANGELOG.md`.
2. Commit, push, and open the release PR:

   ```sh
   git commit -am "Bump to X.Y.Z+N"
   git push origin dev
   gh pr create --base main --head dev --title "Release X.Y.Z" --body "<CHANGELOG entry>"
   ```

3. If the release includes new migrations, edge functions, or data
   imports, apply them to prod (see Environments below) before merging.
   Re-link Supabase to dev afterwards.
4. Wait for the `Release check` workflow to pass. It fails if the version
   isn't higher than `main`'s or the CHANGELOG has no entry for it.
5. Merge. That deploys production.

Without Claude Code, do step 1 by hand: bump `version:` in `pubspec.yaml`
(build number +1), and move the `[Unreleased]` lines under a new
`## [X.Y.Z] — YYYY-MM-DD` heading.

### Environments

Local runs always use the dev Supabase project.

- **App** reads `.env` (bundled as an asset): `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`. Keep the dev project's values in it.
- **Import scripts** read `.env.scripts` (dev) by default. Target prod
  explicitly:

  ```sh
  node import-curated-data.mjs --only=languages                              # dev
  ENV_FILE=.env.scripts.prod node import-curated-data.mjs --only=languages   # prod
  ```

- **Migrations and edge functions** go to dev first, then prod on release:

  ```sh
  supabase link --project-ref zhzcnelmwgmcvtohhvsx && supabase db push   # dev
  supabase link --project-ref ipnjdafxnnidetfqshtk && supabase db push   # prod
  ```

  `000_baseline.sql` is prod's schema as of 2026-10-26. A new project
  gets it plus a copy of prod's data, not a replay of 005 onward.

  Re-link to dev afterwards so the default target stays dev.

All `.env*` files are gitignored.

### GitHub secrets

| Secret | Used by |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | production deploy |
| `DEV_SUPABASE_URL`, `DEV_SUPABASE_PUBLISHABLE_KEY` | staging deploy |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | staging deploy |
