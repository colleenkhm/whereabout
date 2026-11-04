# whereabout

*Making the foreign familiar.*

A hand-curated travel database, with a Flutter app as its reader.

## Development workflow

| Branch | Deploys to | Supabase |
| --- | --- | --- |
| `main` | www.whereabout.world (GitHub Pages) | prod |
| `dev` | Cloudflare Worker `whereabout-staging` (`wrangler.jsonc`) | dev |
| `feature/*` | nowhere (run locally) | dev |

1. Branch off `dev`: `git switch dev && git pull && git switch -c feature/<name>`.
2. Open a PR into `dev`. CI runs `flutter analyze` and `flutter test`.
3. Merging into `dev` deploys staging. Click around there.
4. **Release:** bump `version:` in `pubspec.yaml`, add a `CHANGELOG.md`
   entry, open a PR from `dev` into `main`. Apply any new migrations and
   imports to prod (below) before merging. Merging deploys production.
   `/release` in Claude Code drafts the bump and CHANGELOG entry for
   approval. The `Release check` workflow fails the PR if either is missing.

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
