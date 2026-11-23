-- Add/dispute contributions from the /contribute flow land in correction_reports.
-- Written only by the submit-contribution Edge Function (service role); no anon policies.

alter table public.correction_reports
  add column if not exists kind text not null default 'dispute'
    check (kind in ('add', 'dispute')),
  -- e.g. {"city": "Lisbon", "category": "restaurant"}
  add column if not exists details jsonb,
  add column if not exists certified boolean not null default false,
  -- Opted in to attaching this to an account with reporter_contact's email, once accounts exist.
  add column if not exists link_to_account boolean not null default false;

-- New card-level subjects alongside the original ones.
alter table public.correction_reports drop constraint if exists correction_reports_subject_type_check;
alter table public.correction_reports add constraint correction_reports_subject_type_check
  check (subject_type = any (array[
    'leadership', 'advisory', 'visa', 'best_time', 'phrase', 'general',
    'city', 'border', 'language', 'practical_norm', 'resource'
  ]));

-- reporter_contact holds the contributor's email (required by the form); indexed for linking to accounts later.
create index if not exists idx_correction_reports_contact
  on public.correction_reports (lower(reporter_contact))
  where reporter_contact is not null;
