-- Plan Task 4: clubs, their links and execs, the exec roster that grants editing rights,
-- site settings, and the club-media bucket for logos and exec photos.
-- Builder calls: emails are normalised text (as in profiles), not citext; the roster
-- normalises whatever is uploaded, so "Jane@MEDS.uwo.ca " matches jane@meds.uwo.ca. Execs
-- (not admins) can't rename a club's slug or archive it.

create type public.campus as enum ('london', 'windsor');
-- The live site's five directory categories (src/data/club-categories.ts).
create type public.club_category as enum ('interest', 'advocacy', 'community', 'mentorship', 'recreational');

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 200),
  description text not null default '' check (length(description) <= 20000),
  logo_path text,
  no_logo boolean not null default false,
  club_email text check (club_email is null or club_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  campuses public.campus[] not null default '{}',
  categories public.club_category[] not null default '{}',
  announcements text not null default '' check (length(announcements) <= 5000),
  archived boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid()
);

create table public.club_links (
  club_id uuid not null references public.clubs (id) on delete cascade,
  position int not null check (position between 1 and 6),
  url text not null check (url ~ '^https?://[^\s]+$' and length(url) <= 500),
  primary key (club_id, position)
);

create table public.club_execs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  position int not null default 0,
  name text not null check (length(trim(name)) between 1 and 200),
  role_title text not null default '' check (length(role_title) <= 200),
  email text check (email is null or email = public.normalise_email(email)),
  photo_path text,
  is_president boolean not null default false,
  show_contact boolean not null default false
);
create index club_execs_club on public.club_execs (club_id, position);

-- The exec spreadsheet. Being on it is what makes someone a club editor, from their first
-- sign-in, with no request or approval step.
create table public.club_roster (
  club_id uuid not null references public.clubs (id) on delete cascade,
  email text not null check (email = public.normalise_email(email) and email like '%@%'),
  exec_name text not null default '',
  role_title text not null default '',
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  uploaded_at timestamptz not null default now(),
  primary key (club_id, email)
);
create index club_roster_email on public.club_roster (email);

create table public.site_settings (
  key text primary key,
  value jsonb not null
);
insert into public.site_settings (key, value) values ('instagram_embed_enabled', 'true');

-- Normalise roster and exec emails before the check sees them.
create function public.normalise_email_column() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.email is not null then new.email := public.normalise_email(new.email); end if;
  return new;
end
$$;
create trigger normalise_email before insert or update on public.club_roster
for each row execute function public.normalise_email_column();
create trigger normalise_email before insert or update on public.club_execs
for each row execute function public.normalise_email_column();

-- True when the signed-in user's email is on the club's roster and they aren't blocked.
create function public.is_club_editor(club uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.club_roster r
    join public.profiles p on p.email = r.email
    where r.club_id = club and p.id = auth.uid() and not p.blocked
  )
$$;

create function public.is_club_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select public.has_role('community_admin', 'site_admin') $$;

-- At most six links per club.
create function public.club_links_limit() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select count(*) from public.club_links where club_id = new.club_id) > 6 then
    raise exception 'a club has at most 6 links' using errcode = '23514';
  end if;
  return new;
end
$$;
create constraint trigger club_links_limit after insert or update on public.club_links
for each row execute function public.club_links_limit();

-- Stamp edits, and keep slug and archived for admins.
create function public.clubs_before_update() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.slug is distinct from old.slug or new.archived is distinct from old.archived)
     and current_user not in ('postgres', 'supabase_admin', 'service_role')
     and not public.is_club_admin() then
    raise exception 'only community admins can rename or archive a club' using errcode = '42501';
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), old.updated_by);
  return new;
end
$$;
create trigger clubs_before_update before update on public.clubs
for each row execute function public.clubs_before_update();

-- Row-level security.
alter table public.clubs enable row level security;
alter table public.club_links enable row level security;
alter table public.club_execs enable row level security;
alter table public.club_roster enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.club_execs, public.club_roster from anon;

create policy clubs_select on public.clubs for select to anon, authenticated
using (not archived or public.is_club_admin());
create policy clubs_update on public.clubs for update to authenticated
using (public.is_club_editor(id) or public.is_club_admin())
with check (public.is_club_editor(id) or public.is_club_admin());
create policy clubs_insert on public.clubs for insert to authenticated with check (public.is_club_admin());
create policy clubs_delete on public.clubs for delete to authenticated using (public.is_club_admin());

-- Links are public with their club; execs and admins edit them.
create policy club_links_select on public.club_links for select to anon, authenticated
using (exists (select 1 from public.clubs c where c.id = club_id));
create policy club_links_write on public.club_links for all to authenticated
using (public.is_club_editor(club_id) or public.is_club_admin())
with check (public.is_club_editor(club_id) or public.is_club_admin());

-- Exec rows (with emails) only for the club's editors and admins; everyone else reads
-- club_execs_public.
create policy club_execs_all on public.club_execs for all to authenticated
using (public.is_club_editor(club_id) or public.is_club_admin())
with check (public.is_club_editor(club_id) or public.is_club_admin());

create policy club_roster_select on public.club_roster for select to authenticated
using (email = (select p.email from public.profiles p where p.id = (select auth.uid())) or public.is_club_admin());
create policy club_roster_write on public.club_roster for all to authenticated
using (public.is_club_admin()) with check (public.is_club_admin());

create policy site_settings_select on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_write on public.site_settings for all to authenticated
using (public.has_role('site_admin')) with check (public.has_role('site_admin'));

-- The public face of club_execs: email only when the exec chose to show it, and nothing
-- for archived clubs. Runs as its owner so anonymous visitors can read it.
create view public.club_execs_public as
select e.id, e.club_id, e.position, e.name, e.role_title,
       case when e.show_contact then e.email end as email,
       e.photo_path, e.is_president
from public.club_execs e
join public.clubs c on c.id = e.club_id
where not c.archived;
grant select on public.club_execs_public to anon, authenticated;

revoke execute on function public.normalise_email_column(), public.club_links_limit(),
  public.clubs_before_update() from public, anon, authenticated;

-- Storage: club-media, public to read. Writes only under clubs/<club id>/ by that club's
-- editors or admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-media', 'club-media', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create function public.club_media_writable(object_name text) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare parts text[] := storage.foldername(object_name);
begin
  if parts[1] is distinct from 'clubs'
     or parts[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_club_editor(parts[2]::uuid) or public.is_club_admin();
end
$$;

create policy club_media_insert on storage.objects for insert to authenticated
with check (bucket_id = 'club-media' and public.club_media_writable(name));
create policy club_media_update on storage.objects for update to authenticated
using (bucket_id = 'club-media' and public.club_media_writable(name))
with check (bucket_id = 'club-media' and public.club_media_writable(name));
create policy club_media_delete on storage.objects for delete to authenticated
using (bucket_id = 'club-media' and public.club_media_writable(name));
