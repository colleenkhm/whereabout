-- Email-updates sign-ups get their own table: from the Contribute page's sign-up card
-- ('signup') and the opt-in checkbox on every form ('feedback', 'contribution'). Replaces correction_reports.wants_updates (045).
-- Written only by Edge Functions (service role); no anon policies.

create table if not exists public.update_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null check (source in ('signup', 'feedback', 'contribution')),
  created_at timestamptz not null default now(),
  -- Set when someone unsubscribes; rows are kept so a re-import can't resubscribe them.
  unsubscribed_at timestamptz
);

create unique index if not exists idx_update_subscribers_email
  on public.update_subscribers (lower(email));

alter table public.update_subscribers enable row level security;

drop index if exists public.idx_correction_reports_wants_updates;
alter table public.correction_reports drop column if exists wants_updates;
