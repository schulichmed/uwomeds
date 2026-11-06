-- Plan Task 2: profiles, roles and the sign-in domain rule.
-- Builder calls: emails are stored as normalised lowercase text (checked), not citext, so
-- comparisons don't depend on the extensions schema; the role helper is
-- current_app_role() because CURRENT_ROLE is a reserved word in Postgres.

create type public.app_role as enum ('student', 'page_editor', 'booking_admin', 'community_admin', 'site_admin');

-- Lowercase and strip all whitespace: "  Jane@MEDS.uwo.ca " -> "jane@meds.uwo.ca".
create function public.normalise_email(raw text) returns text
language sql immutable set search_path = ''
as $$ select lower(regexp_replace(coalesce(raw, ''), '\s', '', 'g')) $$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = public.normalise_email(email)),
  role public.app_role not null default 'student',
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.allowed_emails (
  email text primary key check (email = public.normalise_email(email)),
  role public.app_role not null default 'student',
  note text,
  added_by uuid references auth.users (id) on delete set null,
  added_at timestamptz not null default now()
);

insert into public.allowed_emails (email, role, note)
values ('hippoit@uwo.ca', 'site_admin', 'Permanent IT Director role account');

-- The signed-in user's role; null when signed out or blocked.
create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p where p.id = auth.uid() and not p.blocked $$;

create function public.has_role(variadic roles public.app_role[]) returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_app_role() = any (roles), false) $$;

-- Only @meds.uwo.ca, @uwo.ca (exact domains) or an approved outside email may sign up.
create function public.check_email_allowed() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  e text := public.normalise_email(new.email);
begin
  if e ~ '^[^@]+@(meds\.)?uwo\.ca$' then
    return new;
  end if;
  if exists (select 1 from public.allowed_emails a where a.email = e) then
    return new;
  end if;
  raise exception 'email not allowed' using errcode = 'P0001';
end
$$;

create trigger check_email_allowed
before insert on auth.users
for each row execute function public.check_email_allowed();

-- Every new account gets a profile; its role comes from allowed_emails when listed there.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  e text := public.normalise_email(new.email);
begin
  insert into public.profiles (id, email, role)
  values (new.id, e, coalesce((select a.role from public.allowed_emails a where a.email = e), 'student'));
  return new;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Role and blocked can only be changed by a site admin (or by the database owner, for fixes).
-- Security invoker on purpose, so current_user is the caller's role.
create function public.guard_profile_admin_fields() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.blocked is distinct from old.blocked)
     and current_user not in ('postgres', 'supabase_admin', 'service_role')
     and not public.has_role('site_admin') then
    raise exception 'only site admins can change roles' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger guard_profile_admin_fields
before update on public.profiles
for each row execute function public.guard_profile_admin_fields();

-- Row-level security.
alter table public.profiles enable row level security;
alter table public.allowed_emails enable row level security;

revoke all on public.profiles, public.allowed_emails from anon;

create policy profiles_select on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.has_role('site_admin'));

create policy profiles_update on public.profiles
for update to authenticated
using (id = (select auth.uid()) or public.has_role('site_admin'))
with check (id = (select auth.uid()) or public.has_role('site_admin'));

create policy allowed_emails_site_admin on public.allowed_emails
for all to authenticated
using (public.has_role('site_admin'))
with check (public.has_role('site_admin'));

revoke execute on function public.check_email_allowed(), public.handle_new_user() from public, anon, authenticated;
