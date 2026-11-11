-- Plan Task 4: clubs, links, execs, the exec roster and club-media storage.
-- Uses its own "pgtap." users and clubs so it never depends on supabase/seed.sql.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

create function pg_temp.mk(e text) returns uuid language plpgsql as $$
declare i uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (i, e);
  return i;
end $$;

create function pg_temp.act_as(e text) returns void language plpgsql as $$
declare u uuid := (select id from public.profiles where email = public.normalise_email(e));
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.club(s text) returns uuid language sql as $$ select id from public.clubs where slug = s $$;

-- Rows changed by an update run as the current role.
create function pg_temp.updated(q text) returns int language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;

select pg_temp.mk('pgtap.exec1@meds.uwo.ca');
select pg_temp.mk('pgtap.student2@meds.uwo.ca');
select pg_temp.mk('pgtap.community@meds.uwo.ca');
update public.profiles set role = 'community_admin' where email = 'pgtap.community@meds.uwo.ca';
do $$ begin
  if not exists (select 1 from public.profiles where email = 'hippoit@uwo.ca') then perform pg_temp.mk('hippoit@uwo.ca'); end if;
end $$;

insert into public.clubs (slug, name, campuses, categories) values
  ('pgtap-surgery', 'Pgtap Surgery Club', '{london}', '{interest}'),
  ('pgtap-peds', 'Pgtap Peds Club', '{windsor}', '{interest}');
insert into public.club_execs (club_id, name, role_title, email, show_contact) values
  (pg_temp.club('pgtap-surgery'), 'Sample Shown', 'President', 'shown@meds.uwo.ca', true),
  (pg_temp.club('pgtap-surgery'), 'Sample Hidden', 'Treasurer', 'hidden@meds.uwo.ca', false);

-- email_case_insensitive: an upper-case roster row still grants access.
insert into public.club_roster (club_id, email, exec_name) values (pg_temp.club('pgtap-surgery'), ' PgTap.Exec1@MEDS.uwo.ca', 'Sample Exec');
select is((select email from public.club_roster where club_id = pg_temp.club('pgtap-surgery')), 'pgtap.exec1@meds.uwo.ca', 'roster emails are normalised');

-- editor_can_update_own_club / editor_cannot_update_other_club
select pg_temp.act_as('pgtap.exec1@meds.uwo.ca');
select is(pg_temp.updated($$update public.clubs set description = 'new' where slug = 'pgtap-surgery'$$), 1, 'an exec updates their own club');
select is(pg_temp.updated($$update public.clubs set description = 'new' where slug = 'pgtap-peds'$$), 0, 'an exec cannot update another club');
select throws_ok($$update public.clubs set archived = true where slug = 'pgtap-surgery'$$, '42501', null, 'an exec cannot archive their club');
select is((select count(*)::int from public.club_execs), 2, 'an exec sees their club''s exec rows');
-- storage_path_guard
select lives_ok(format($$insert into storage.objects (bucket_id, name) values ('club-media', 'clubs/%s/logo.png')$$, pg_temp.club('pgtap-surgery')), 'an exec uploads to their club''s folder');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('club-media', 'clubs/%s/logo.png')$$, pg_temp.club('pgtap-peds')), '42501', null, 'but not to another club''s');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('club-media', 'other/logo.png')$$, '42501', null, 'nor outside clubs/');
-- settings_admin_only
select is(pg_temp.updated($$update public.site_settings set value = 'false' where key = 'instagram_embed_enabled'$$), 0, 'a student cannot change site settings');
reset role;

-- student_cannot_add_self_to_roster
select pg_temp.act_as('pgtap.student2@meds.uwo.ca');
select throws_ok(format($$insert into public.club_roster (club_id, email) values ('%s', 'pgtap.student2@meds.uwo.ca')$$, pg_temp.club('pgtap-peds')), '42501', null, 'a student cannot add themselves to a roster');
select is((select count(*)::int from public.club_roster), 0, 'a student sees no roster rows');
select is((select count(*)::int from public.club_execs), 0, 'nor exec rows with emails');
reset role;

-- roster_grants_access_before_first_sign_in
select pg_temp.act_as('pgtap.community@meds.uwo.ca');
select lives_ok(format($$insert into public.club_roster (club_id, email) values ('%s', 'pgtap.newexec@meds.uwo.ca')$$, pg_temp.club('pgtap-peds')), 'a community admin adds an exec');
reset role;
select pg_temp.mk('pgtap.newexec@meds.uwo.ca');
select pg_temp.act_as('pgtap.newexec@meds.uwo.ca');
select is(pg_temp.updated($$update public.clubs set description = 'hello' where slug = 'pgtap-peds'$$), 1, 'the new exec edits on their first sign-in');
reset role;

-- seven_links_refused
insert into public.club_links (club_id, position, url)
select pg_temp.club('pgtap-surgery'), g, 'https://example.com/' || g from generate_series(1, 6) g;
select throws_ok(format($$insert into public.club_links (club_id, position, url) values ('%s', 7, 'https://example.com/7')$$, pg_temp.club('pgtap-surgery')), '23514', null, 'a seventh link is refused');
select throws_ok(format($$insert into public.club_links (club_id, position, url) values ('%s', 1, 'javascript:alert(1)')$$, pg_temp.club('pgtap-peds')), '23514', null, 'a javascript: link is refused');

-- anon_sees_no_hidden_emails
select set_config('request.jwt.claims', '', true);
set local role anon;
select is((select email from public.club_execs_public where name = 'Sample Hidden'), null, 'anon does not see a hidden email');
select is((select email from public.club_execs_public where name = 'Sample Shown'), 'shown@meds.uwo.ca', 'anon sees an email the exec chose to show');
reset role;

-- settings_admin_only (site admin)
select pg_temp.act_as('hippoit@uwo.ca');
select is(pg_temp.updated($$update public.site_settings set value = 'false' where key = 'instagram_embed_enabled'$$), 1, 'a site admin changes site settings');
reset role;

-- blocked_editor_cannot_update
update public.profiles set blocked = true where email = 'pgtap.exec1@meds.uwo.ca';
select pg_temp.act_as('pgtap.exec1@meds.uwo.ca');
select is(pg_temp.updated($$update public.clubs set description = 'blocked' where slug = 'pgtap-surgery'$$), 0, 'a blocked exec cannot update');
reset role;
update public.profiles set blocked = false where email = 'pgtap.exec1@meds.uwo.ca';

-- removed_from_roster_cannot_update
delete from public.club_roster where email = 'pgtap.exec1@meds.uwo.ca';
select pg_temp.act_as('pgtap.exec1@meds.uwo.ca');
select is(pg_temp.updated($$update public.clubs set description = 'gone' where slug = 'pgtap-surgery'$$), 0, 'an exec taken off the roster cannot update');
reset role;

select * from finish();
rollback;
