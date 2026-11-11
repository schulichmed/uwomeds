-- Plan Task 27: MedFriend progress is private to its reader.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

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

select pg_temp.mk('pgtap.mf1@meds.uwo.ca');
select pg_temp.mk('pgtap.mf2@meds.uwo.ca');

select pg_temp.act_as('pgtap.mf1@meds.uwo.ca');
select is(public.medfriend_progress_put('nsq.fom.v1.b1', '{"q1":{"lastTs":1}}', null), 1::bigint, 'a reader saves an entry');
select is(public.medfriend_progress_put('memo:nsq.fom.v1.', '{"v":1,"memos":{}}', null), 1::bigint, 'notes save too');
select is(public.medfriend_progress_put('nsq.pom1.v1.b1', '{}', null), 1::bigint, 'another course saves');
select is(public.medfriend_progress_put('nsq.fom.v1.b1', '{"q1":{"lastTs":2}}', null), null, 'a blind write over an existing entry is refused');
select is(public.medfriend_progress_put('nsq.fom.v1.b1', '{"q1":{"lastTs":2}}', 1), 2::bigint, 'a write that read the latest version saves');
select is(public.medfriend_progress_put('nsq.fom.v1.b1', '{"q1":{"lastTs":3}}', 1), null, 'a write that raced another is refused');
select throws_ok($$select public.medfriend_progress_put('firebase:x', '{}', null)$$, '23514', null, 'a key outside the MedFriend prefixes throws');
select is((select count(*)::int from public.medfriend_progress_pull('nsq.fom.v1.', 0)), 2, 'pull returns one course only');
reset role;

select pg_temp.act_as('pgtap.mf2@meds.uwo.ca');
select is((select count(*)::int from public.medfriend_progress), 0, 'student2 cannot read the rows of student1');
select is((select count(*)::int from public.medfriend_progress_pull('nsq.fom.v1.', 0)), 0, 'nor pull them');
select is(public.medfriend_progress_wipe(array['nsq.fom.v1.']), 0, 'nor delete them');
reset role;

select pg_temp.act_as('pgtap.mf1@meds.uwo.ca');
select is(public.medfriend_progress_wipe(array['nsq.fom.v1.']), 2, 'a reader deletes the saved copy of one course');
select is((select count(*)::int from public.medfriend_progress), 1, 'the other course stays');
reset role;

select * from finish();
rollback;
