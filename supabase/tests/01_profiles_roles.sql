-- Plan Task 2: profiles, roles and the sign-in domain rule.
-- Test users use "pgtap." addresses so they never clash with supabase/seed.sql.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

create function pg_temp.mk(e text) returns uuid language plpgsql as $$
declare i uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (i, e);
  return i;
end $$;

-- Act as the user with this email (call it as postgres; `reset role` to return).
create function pg_temp.act_as(e text) returns void language plpgsql as $$
declare u uuid := (select id from public.profiles where email = public.normalise_email(e));
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- domain_check
select lives_ok($$select pg_temp.mk('pgtap.student1@meds.uwo.ca')$$, 'meds.uwo.ca signs up');
select lives_ok($$select pg_temp.mk('pgtap.staff1@uwo.ca')$$, 'uwo.ca signs up');
select lives_ok($$select pg_temp.mk('pgtap.Jane@MEDS.uwo.ca ')$$, 'case and spaces are normalised');
select throws_ok($$select pg_temp.mk('x@meds.uwo.ca.evil.com')$$, 'P0001', 'email not allowed', 'suffix trick refused');
select throws_ok($$select pg_temp.mk('x@evilmeds.uwo.ca')$$, 'P0001', 'email not allowed', 'lookalike subdomain refused');
select throws_ok($$select pg_temp.mk('x@evil-uwo.ca')$$, 'P0001', 'email not allowed', 'lookalike domain refused');
select throws_ok($$select pg_temp.mk('x@uwo.ca.evil.com')$$, 'P0001', 'email not allowed', 'uwo.ca suffix trick refused');
select throws_ok($$select pg_temp.mk('x@eng.uwo.ca')$$, 'P0001', 'email not allowed', 'other uwo.ca subdomain refused');
select throws_ok($$select pg_temp.mk('x@gmail.com')$$, 'P0001', 'email not allowed', 'gmail refused');
insert into public.allowed_emails (email, note) values ('x@gmail.com', 'pgtap');
select lives_ok($$select pg_temp.mk('x@gmail.com')$$, 'approved outside email signs up');
select is((select role::text from public.profiles where email = 'x@gmail.com'), 'student', 'approved outside email is a student');
select is((select email from public.profiles where email like 'pgtap.jane%'), 'pgtap.jane@meds.uwo.ca', 'profile email is normalised');

-- hippoit_seeded_admin (seed.sql creates it; create it here if the seed didn't run)
do $$ begin
  if not exists (select 1 from public.profiles where email = 'hippoit@uwo.ca') then
    perform pg_temp.mk('hippoit@uwo.ca');
  end if;
end $$;
select is((select role::text from public.profiles where email = 'hippoit@uwo.ca'), 'site_admin', 'hippoit@uwo.ca is a site admin');

-- student_cannot_promote_self
select pg_temp.act_as('pgtap.student1@meds.uwo.ca');
select is(public.current_app_role()::text, 'student', 'student1 is a student');
select is(public.has_role('site_admin'), false, 'student1 is not a site admin');
select throws_ok($$update public.profiles set role = 'site_admin' where email = 'pgtap.student1@meds.uwo.ca'$$, '42501', 'only site admins can change roles', 'student cannot promote self');
select throws_ok($$update public.profiles set blocked = true where email = 'pgtap.student1@meds.uwo.ca'$$, '42501', 'only site admins can change roles', 'student cannot change blocked');

-- profiles_rls
select is((select count(*)::int from public.profiles), 1, 'student sees only their own profile');
select is((select count(*)::int from public.allowed_emails), 0, 'student cannot read allowed_emails');
reset role;

select pg_temp.act_as('hippoit@uwo.ca');
select lives_ok($$update public.profiles set role = 'page_editor' where email = 'pgtap.staff1@uwo.ca'$$, 'site admin can change a role');
reset role;
select is((select role::text from public.profiles where email = 'pgtap.staff1@uwo.ca'), 'page_editor', 'the role change stuck');
select set_config('pgtap.profile_count', (select count(*) from public.profiles)::text, true);
select pg_temp.act_as('hippoit@uwo.ca');
select is((select count(*)::text from public.profiles), current_setting('pgtap.profile_count'), 'site admin sees every profile');
reset role;

-- blocked_user_has_no_role
update public.profiles set blocked = true where email = 'pgtap.staff1@uwo.ca';
select pg_temp.act_as('pgtap.staff1@uwo.ca');
select is(public.current_app_role(), null, 'blocked user has no role');
reset role;

-- anon_cannot_read_profiles
set local role anon;
select throws_ok($$select count(*) from public.profiles$$, '42501', null, 'anon cannot read profiles');
reset role;

select * from finish();
rollback;
