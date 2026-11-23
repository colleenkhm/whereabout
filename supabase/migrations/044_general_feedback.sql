-- General feedback from /contribute/feedback: about the site, not one country.
-- Stored in correction_reports with subject_type 'feedback' and no country.

alter table public.correction_reports alter column country_id drop not null;

alter table public.correction_reports drop constraint if exists correction_reports_subject_type_check;
alter table public.correction_reports add constraint correction_reports_subject_type_check
  check (subject_type = any (array[
    'leadership', 'advisory', 'visa', 'best_time', 'phrase', 'general',
    'city', 'border', 'language', 'practical_norm', 'resource', 'feedback'
  ]));

-- Only feedback may skip the country.
alter table public.correction_reports drop constraint if exists correction_reports_country_required;
alter table public.correction_reports add constraint correction_reports_country_required
  check (country_id is not null or subject_type = 'feedback');
