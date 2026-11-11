-- Plan Task 26: the MedFriend notice is recorded on the reader's own profile only, and a
-- reader can't change their own profile email.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

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

select pg_temp.mk('pgtap.reader1@meds.uwo.ca');
select pg_temp.mk('pgtap.reader2@meds.uwo.ca');

select is((select medfriend_notice_at from public.profiles where email = 'pgtap.reader1@meds.uwo.ca'), null, 'new readers have not seen the notice');

select pg_temp.act_as('pgtap.reader1@meds.uwo.ca');
update public.profiles set medfriend_notice_at = now() where email = 'pgtap.reader1@meds.uwo.ca';
update public.profiles set medfriend_notice_at = now() where email = 'pgtap.reader2@meds.uwo.ca';
select throws_ok($$update public.profiles set email = 'pgtap.someone@meds.uwo.ca' where email = 'pgtap.reader1@meds.uwo.ca'$$,
  '42501', 'only site admins can change roles', 'a reader cannot change their own email');
reset role;

select isnt((select medfriend_notice_at from public.profiles where email = 'pgtap.reader1@meds.uwo.ca'), null, 'a reader records their own notice');
select is((select medfriend_notice_at from public.profiles where email = 'pgtap.reader2@meds.uwo.ca'), null, 'a reader cannot record anyone else''s');
select is((select email from public.profiles where email like 'pgtap.reader1%'), 'pgtap.reader1@meds.uwo.ca', 'the email did not change');

do $$ begin
  if not exists (select 1 from public.profiles where email = 'hippoit@uwo.ca') then
    perform pg_temp.mk('hippoit@uwo.ca');
  end if;
end $$;
select pg_temp.act_as('hippoit@uwo.ca');
select lives_ok($$update public.profiles set email = 'pgtap.reader2b@meds.uwo.ca' where email = 'pgtap.reader2@meds.uwo.ca'$$, 'a site admin can fix an email');
reset role;

select * from finish();
rollback;
