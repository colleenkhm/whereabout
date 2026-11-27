-- Favoriting (#9): a user marks a country visited and/or interested. Independent marks:
-- "been there, want to go back" is both.

-- Marks reference profiles; backfill any user created before 047's trigger.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create table if not exists public.country_marks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  country_id text not null references public.countries (id) on update cascade on delete cascade,
  kind text not null check (kind in ('visited', 'interested')),
  created_at timestamptz not null default now(),
  primary key (user_id, country_id, kind)
);

alter table public.country_marks enable row level security;

-- Own rows only. No update: a mark is set or cleared, nothing to edit.
drop policy if exists "country_marks_select_own" on public.country_marks;
create policy "country_marks_select_own" on public.country_marks
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "country_marks_insert_own" on public.country_marks;
create policy "country_marks_insert_own" on public.country_marks
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "country_marks_delete_own" on public.country_marks;
create policy "country_marks_delete_own" on public.country_marks
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.country_marks from anon;
