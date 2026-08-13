# Partner Marketplace Regression Checklist (University Ops V1)

After shipping dual-mode on `uni.sallam.ma`, verify the **partner marketplace is unchanged** and **cannot see ops data**.

## Auth isolation

- [ ] Partner account can sign in at `/login` and lands on `/uni/dashboard`
- [ ] Partner visiting `/ops` is redirected away (no Today dashboard, no universities list)
- [ ] Sallam admin lands on `/ops` and does not use partner shortlist UI as home
- [ ] Admin visiting `/uni/*` redirects to `/ops`
- [ ] Session cookie `sallam-admin-auth` still works across docs / finance / uni for admins

## Partner marketplace (must still work)

- [ ] `/uni/dashboard` stats load
- [ ] `/uni/students` lists visible marketplace profiles
- [ ] Express interest writes `university_shortlists` with status `interested`
- [ ] `/uni/interested` shows shortlisted students
- [ ] `/uni/settings` shows partner university name + tier
- [ ] Partner cannot read other universities’ shortlists (existing RLS)

## Database RLS (ops_*)

- [ ] As partner JWT, `select * from ops_universities` returns 0 / permission denied
- [ ] As partner JWT, `select * from ops_offers` returns 0 / permission denied
- [ ] As partner JWT, `select * from ops_partnerships` returns 0 / permission denied
- [ ] As admin JWT, ops tables are readable/writable
- [ ] `partner_universities.ops_university_id` nullable column does not break partner queries

## Application compat

- [ ] Existing `pipeline_student_applications` without `ops_offer_id` still load in docs
- [ ] Linking an offer from `/ops/students` sets `ops_offer_id` + full `offer_snapshot` (university, program, intake, tuition, scholarship, deadline, requirements, verification) and legacy uni/program FKs
- [ ] Snapshot remains after offer status/tuition changes to closed/expired

## Migrations

- [ ] `053_university_ops.sql` applied on ops Supabase
- [ ] `054_university_ops_seed_demand.sql` applied only after 053 (optional)
