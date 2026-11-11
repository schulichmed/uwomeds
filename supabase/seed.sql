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

-- Fake clubs (plan Task 4). student1 is on the Fake Surgery Club roster.
insert into public.clubs (slug, name, description, campuses, categories) values
  ('fake-surgery-club', 'Fake Surgery Club', 'A fake club for local testing.', '{london}', '{interest}'),
  ('fake-peds-club', 'Fake Peds Club', 'A fake club with no links.', '{windsor}', '{interest}'),
  ('fake-wellness-club', 'Fake Wellness Club', 'A fake club on both campuses.', '{london,windsor}', '{recreational}');
insert into public.club_links (club_id, position, url)
select id, 1, 'https://www.instagram.com/fakesurgeryclub/' from public.clubs where slug = 'fake-surgery-club'
union all
select id, 2, 'https://www.facebook.com/fakesurgeryclub' from public.clubs where slug = 'fake-surgery-club'
union all
select id, 1, 'https://example.com/fake-wellness' from public.clubs where slug = 'fake-wellness-club';
insert into public.club_execs (club_id, name, role_title, email, is_president, show_contact)
select id, 'Sample President', 'President', 'student1@meds.uwo.ca', true, true from public.clubs where slug = 'fake-surgery-club';
insert into public.club_roster (club_id, email, exec_name, role_title)
select id, 'student1@meds.uwo.ca', 'Sample President', 'President' from public.clubs where slug = 'fake-surgery-club';
