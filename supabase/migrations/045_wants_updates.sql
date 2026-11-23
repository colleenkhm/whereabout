-- Opt-in to email updates about whereabout, from the general feedback form.
-- Nothing sends these yet; this is the list to email once there is something to send.

alter table public.correction_reports
  add column if not exists wants_updates boolean not null default false;

create index if not exists idx_correction_reports_wants_updates
  on public.correction_reports (lower(reporter_contact))
  where wants_updates;
