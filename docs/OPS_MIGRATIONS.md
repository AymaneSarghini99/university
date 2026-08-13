# University Ops — Apply Migrations

Ops schema of record lives in `apps/docs/migrations/` (shared ops Supabase).

1. Open Supabase SQL editor for project `aqolvmigpihjrpwgkzbw`
2. Run `053_university_ops.sql` (tables + RLS + compat columns)
3. Optionally run `054_university_ops_seed_demand.sql` (25 demand-based universities + programs + Sep 2026/2027 offers in verifying/potential)
4. Confirm with:

```sql
select count(*) from ops_universities;
select status, count(*) from ops_offers group by status;
select * from ops_universities where id is not null limit 1; -- as admin
```

Copies also live under `apps/university/supabase/migrations/` for discoverability.
