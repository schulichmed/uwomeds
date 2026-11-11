-- Plan Task 27: MedFriend study progress saved to the uwomeds.com account, replacing
-- MedFriend's Firebase. One row per localStorage entry MedFriend syncs (its sync.js): a
-- course's blocks ("nsq.<course>.v1.<block>"), its notes ("memo:<prefix>") and its clears
-- ("reset:<prefix>"). The browser does the merging (merge, never overwrite); the database
-- stores, and refuses a write that raced another (version check).
create table public.medfriend_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (key ~ '^(nsq\.|memo:|reset:|pc-theme$)' and length(key) <= 200),
  value jsonb not null check (pg_column_size(value) <= 1048576),
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.medfriend_progress enable row level security;
revoke all on public.medfriend_progress from anon;
grant select, insert, update, delete on public.medfriend_progress to authenticated;

-- Own rows only, and not while blocked (current_app_role() is null for a blocked profile).
create policy medfriend_progress_own on public.medfriend_progress
for all to authenticated
using (user_id = (select auth.uid()) and (select public.current_app_role()) is not null)
with check (user_id = (select auth.uid()) and (select public.current_app_role()) is not null);

-- Does `entry_key` belong to the course whose localStorage prefix is `prefix`?
create function public.medfriend_key_in(entry_key text, prefix text) returns boolean
language sql immutable set search_path = ''
as $$
  select length(prefix) > 0
     and ((starts_with(entry_key, prefix) and length(entry_key) > length(prefix))
          or entry_key = 'memo:' || prefix or entry_key = 'reset:' || prefix)
$$;

-- A course's entries written after `since_ms` (ms since 1970; 0 for all).
create function public.medfriend_progress_pull(prefix text, since_ms bigint)
returns table (k text, d jsonb, ts bigint, ver bigint)
language sql stable set search_path = ''
as $$
  select p.key, p.value, floor(extract(epoch from p.updated_at) * 1000)::bigint, p.version
  from public.medfriend_progress p
  where p.user_id = auth.uid()
    and public.medfriend_key_in(p.key, prefix)
    and p.updated_at > to_timestamp(greatest(since_ms, 0) / 1000.0)
$$;

-- Write one entry if nobody wrote it since the caller read version `expected` (null: the
-- caller saw no entry). Returns the new version, or null when another write got there first.
create function public.medfriend_progress_put(entry_key text, entry_value jsonb, expected bigint)
returns bigint
language plpgsql set search_path = ''
as $$
declare v bigint;
begin
  if expected is null then
    insert into public.medfriend_progress (user_id, key, value)
    values (auth.uid(), entry_key, entry_value)
    on conflict (user_id, key) do nothing
    returning version into v;
  else
    update public.medfriend_progress
    set value = entry_value, version = version + 1, updated_at = clock_timestamp()
    where user_id = auth.uid() and key = entry_key and version = expected
    returning version into v;
  end if;
  return v;
end
$$;

-- "Delete my saved copy": every entry of these courses.
create function public.medfriend_progress_wipe(prefixes text[]) returns integer
language sql set search_path = ''
as $$
  with gone as (
    delete from public.medfriend_progress p
    where p.user_id = auth.uid()
      and exists (select 1 from unnest(prefixes) x where public.medfriend_key_in(p.key, x))
    returning 1
  )
  select count(*)::int from gone
$$;

revoke execute on function public.medfriend_progress_pull(text, bigint),
  public.medfriend_progress_put(text, jsonb, bigint),
  public.medfriend_progress_wipe(text[]) from public, anon;
grant execute on function public.medfriend_progress_pull(text, bigint),
  public.medfriend_progress_put(text, jsonb, bigint),
  public.medfriend_progress_wipe(text[]) to authenticated;
