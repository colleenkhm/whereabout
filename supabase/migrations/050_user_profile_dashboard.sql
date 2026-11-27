-- User profile dashboard (#96): home base, theme, trips, travel companions.
-- Tables stay own-rows-only; other people's profiles are read through the
-- security definer functions at the bottom, which check can_view_profile.

alter table public.profiles
  add column if not exists home_base text check (char_length(home_base) <= 80),
  add column if not exists theme text not null default 'plum'
    check (theme in ('plum', 'aubergine', 'rust', 'ochre', 'forest', 'teal', 'harbor', 'cocoa'));

-- ---------------------------------------------------------------- friendships

create table if not exists public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- One row per pair, whichever side asked.
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

create or replace function public.set_friendship_accepted_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    new.accepted_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_friendship_accepted_at on public.friendships;
create trigger trg_friendship_accepted_at
  before update on public.friendships
  for each row execute function public.set_friendship_accepted_at();

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own" on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

drop policy if exists "friendships_insert_request" on public.friendships;
create policy "friendships_insert_request" on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending' and accepted_at is null);

-- Only the addressee accepts. Column grant below keeps the ids fixed.
drop policy if exists "friendships_accept" on public.friendships;
create policy "friendships_accept" on public.friendships
  for update to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()) and status = 'accepted');

-- Decline, cancel, or remove: either side.
drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

revoke all on public.friendships from anon;
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;

-- ---------------------------------------------------------------- trips

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text check (char_length(name) <= 80),
  start_date date not null,
  end_date date,
  -- Object path in the trip-photos bucket.
  photo_path text check (char_length(photo_path) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists trips_owner_idx on public.trips (owner_id, start_date desc);

create or replace trigger trg_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own" on public.trips
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips
  for delete to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.trips from anon;

create table if not exists public.trip_countries (
  trip_id uuid not null references public.trips (id) on delete cascade,
  country_id text not null references public.countries (id) on update cascade on delete cascade,
  arrival_date date,
  departure_date date,
  sort_order integer not null default 0,
  primary key (trip_id, country_id)
);

alter table public.trip_countries enable row level security;

drop policy if exists "trip_countries_all_own" on public.trip_countries;
create policy "trip_countries_all_own" on public.trip_countries
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = (select auth.uid())));

revoke all on public.trip_countries from anon;

-- A trip that has started marks its countries visited. Never unmarks.
create or replace function public.mark_trip_visited()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'trip_countries' then
    insert into public.country_marks (user_id, country_id, kind)
    select t.owner_id, new.country_id, 'visited'
    from public.trips t
    where t.id = new.trip_id and t.start_date <= current_date
    on conflict do nothing;
  elsif new.start_date <= current_date then
    insert into public.country_marks (user_id, country_id, kind)
    select new.owner_id, tc.country_id, 'visited'
    from public.trip_countries tc
    where tc.trip_id = new.id
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.mark_trip_visited() from public, anon, authenticated;

drop trigger if exists trg_trip_country_visited on public.trip_countries;
create trigger trg_trip_country_visited
  after insert on public.trip_countries
  for each row execute function public.mark_trip_visited();

drop trigger if exists trg_trip_visited on public.trips;
create trigger trg_trip_visited
  after update of start_date on public.trips
  for each row execute function public.mark_trip_visited();

-- ---------------------------------------------------------------- visibility

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- Self, an accepted friend, or a finished profile set to 'link'.
create or replace function public.can_view_profile(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select owner = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = owner and p.visibility = 'link' and p.profile_completed_at is not null
    )
    or public.are_friends(owner, (select auth.uid()));
$$;

-- Storage folder names are user ids as text.
create or replace function public.can_view_profile_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id::text = folder and public.can_view_profile(p.id));
$$;

revoke execute on function public.are_friends(uuid, uuid) from public, anon, authenticated;
grant execute on function public.can_view_profile(uuid) to anon, authenticated;
grant execute on function public.can_view_profile_folder(text) to anon, authenticated;

-- ---------------------------------------------------------------- storage

drop policy if exists "avatars_select_viewable" on storage.objects;
create policy "avatars_select_viewable" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars' and public.can_view_profile_folder((storage.foldername(name))[1]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-photos', 'trip-photos', false, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- trip-photos/<user id>/...: owner writes, profile viewers read.
drop policy if exists "trip_photos_select_viewable" on storage.objects;
create policy "trip_photos_select_viewable" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'trip-photos' and public.can_view_profile_folder((storage.foldername(name))[1]));

drop policy if exists "trip_photos_insert_own" on storage.objects;
create policy "trip_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "trip_photos_update_own" on storage.objects;
create policy "trip_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "trip_photos_delete_own" on storage.objects;
create policy "trip_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------- reads

-- Anyone holding the link sees the name (that's the invite). The rest needs can_view.
-- relationship: self | friends | requested (viewer asked) | incoming (they asked) | none | anon.
create or replace function public.get_profile(p_id uuid)
returns table (
  id uuid,
  display_name text,
  home_base text,
  avatar_path text,
  theme text,
  visited_count integer,
  trip_count integer,
  friend_count integer,
  relationship text,
  can_view boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (select (select auth.uid()) as uid),
  ok as (select public.can_view_profile(p_id) as v)
  select
    p.id,
    p.display_name,
    case when ok.v then p.home_base end,
    case when ok.v then p.avatar_path end,
    p.theme,
    case when ok.v then (select count(*)::integer from public.country_marks m where m.user_id = p.id and m.kind = 'visited') end,
    case when ok.v then (select count(*)::integer from public.trips t where t.owner_id = p.id) end,
    case when ok.v then (
      select count(*)::integer from public.friendships f
      where f.status = 'accepted' and p.id in (f.requester_id, f.addressee_id)
    ) end,
    case
      when viewer.uid is null then 'anon'
      when viewer.uid = p.id then 'self'
      else coalesce((
        select case
          when f.status = 'accepted' then 'friends'
          when f.requester_id = viewer.uid then 'requested'
          else 'incoming'
        end
        from public.friendships f
        where (f.requester_id = viewer.uid and f.addressee_id = p.id)
           or (f.requester_id = p.id and f.addressee_id = viewer.uid)
      ), 'none')
    end,
    ok.v
  from public.profiles p, viewer, ok
  where p.id = p_id and p.profile_completed_at is not null;
$$;

-- Newest first; countries in trip order.
create or replace function public.get_profile_trips(p_id uuid)
returns table (
  id uuid,
  name text,
  start_date date,
  end_date date,
  photo_path text,
  country_ids text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.name, t.start_date, t.end_date, t.photo_path,
    coalesce(array(
      select tc.country_id from public.trip_countries tc
      where tc.trip_id = t.id order by tc.sort_order, tc.country_id
    ), '{}')
  from public.trips t
  where t.owner_id = p_id and public.can_view_profile(p_id)
  order by t.start_date desc, t.created_at desc;
$$;

-- Accepted friends the viewer may see (so a private friend isn't listed to strangers).
create or replace function public.get_companions(p_id uuid)
returns table (id uuid, display_name text, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.avatar_path
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = p_id then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and p_id in (f.requester_id, f.addressee_id)
    and public.can_view_profile(p_id)
    and (p_id = (select auth.uid()) or public.can_view_profile(p.id))
  order by f.accepted_at desc;
$$;

-- Own pending requests, both directions. Names only: they aren't friends yet.
create or replace function public.get_friend_requests()
returns table (id uuid, display_name text, direction text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name,
    case when f.addressee_id = (select auth.uid()) then 'incoming' else 'outgoing' end
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = (select auth.uid()) then f.addressee_id else f.requester_id end
  where f.status = 'pending' and (select auth.uid()) in (f.requester_id, f.addressee_id)
  order by f.created_at desc;
$$;

revoke execute on function public.get_profile(uuid) from public;
revoke execute on function public.get_profile_trips(uuid) from public;
revoke execute on function public.get_companions(uuid) from public;
revoke execute on function public.get_friend_requests() from public, anon;
grant execute on function public.get_profile(uuid) to anon, authenticated;
grant execute on function public.get_profile_trips(uuid) to anon, authenticated;
grant execute on function public.get_companions(uuid) to anon, authenticated;
grant execute on function public.get_friend_requests() to authenticated;
