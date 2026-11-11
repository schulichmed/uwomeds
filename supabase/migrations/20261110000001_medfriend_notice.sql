-- Plan Task 26: when a reader pressed "I understand" on the MedFriend notice (null = not yet).
-- Readers set it on their own profile through the existing profiles_update policy.
alter table public.profiles add column medfriend_notice_at timestamptz;

-- Builder call: that policy would also let a reader change their own profile email, which
-- club access (Task 4) will rely on. Email now changes only with role and blocked: by a site
-- admin or the database owner.
create or replace function public.guard_profile_admin_fields() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.role is distinct from old.role
      or new.blocked is distinct from old.blocked
      or new.email is distinct from old.email)
     and current_user not in ('postgres', 'supabase_admin', 'service_role')
     and not public.has_role('site_admin') then
    raise exception 'only site admins can change roles' using errcode = '42501';
  end if;
  return new;
end
$$;
