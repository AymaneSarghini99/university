-- ============================================================================
-- MIGRATION 055 — Separate operational status from relationship status in ops
-- Additive only. No deletions. No data loss.
-- ============================================================================

-- 1. Operational status on the canonical university identity
alter table public.ops_universities
  add column if not exists status text not null default 'research'
    check (status in ('research', 'verifying', 'active', 'closed', 'archived'));

comment on column public.ops_universities.status is
  'Operational status: research → verifying → active → closed → archived. Independent of partnership relationship.';

-- 2. Relationship status on the partnership row
alter table public.ops_partnerships
  add column if not exists relationship_status text not null default 'no_relationship'
    check (relationship_status in (
      'no_relationship', 'contact_identified', 'contacted', 'in_discussion', 'partner', 'inactive', 'archived'
    ));

comment on column public.ops_partnerships.relationship_status is
  'Relationship status: no_relationship → contact_identified → contacted → in_discussion → partner. Independent of operational status.';

-- 3. Backfill relationship_status from existing status
update public.ops_partnerships
set relationship_status = case status
  when 'research' then 'no_relationship'
  when 'contacted' then 'contacted'
  when 'replied' then 'in_discussion'
  when 'negotiating' then 'in_discussion'
  when 'partner' then 'partner'
  when 'active' then 'partner'
  when 'inactive' then 'inactive'
  when 'archived' then 'archived'
  else 'no_relationship'
end
where relationship_status = 'no_relationship';

-- 4. Backfill operational status for existing universities
-- Seed universities from migration 054 are already marked as seed in internal_notes; keep them as research.
-- Universities with real partner/pipeline links stay as research until staff verifies them.
update public.ops_universities
set status = 'research'
where status is null;

-- 5. Ensure updated_at trigger still covers ops_universities (already created in 053, but be explicit)
do $$ begin
  create trigger trg_ops_universities_updated
    before update on public.ops_universities
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null;
end $$;

-- 6. Comment update for clarity
comment on table public.ops_partnerships is
  'University relationship tracking. relationship_status = relationship stage. Operational status lives on ops_universities.status.';
