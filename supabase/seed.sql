-- Fake accounts for local development and CI. No real people.
-- Roles come from allowed_emails (hippoit@uwo.ca) or are set below.
insert into public.allowed_emails (email, role, note) values
  ('booking.admin@meds.uwo.ca', 'booking_admin', 'fake seed account'),
  ('community@meds.uwo.ca', 'community_admin', 'fake seed account'),
  ('editor@meds.uwo.ca', 'page_editor', 'fake seed account')
on conflict (email) do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', e, now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from unnest(array[
  'student1@meds.uwo.ca',
  'student2@meds.uwo.ca',
  'staff1@uwo.ca',
  'editor@meds.uwo.ca',
  'booking.admin@meds.uwo.ca',
  'community@meds.uwo.ca',
  'hippoit@uwo.ca'
]) as e;
