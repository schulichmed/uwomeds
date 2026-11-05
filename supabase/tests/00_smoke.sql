-- Smoke test: pgTAP runs against the local database. Real tests start in Task 2.
begin;
select plan(1);
select has_schema('public');
select * from finish();
rollback;
