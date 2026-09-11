-- =============================================================================
-- MIGRATION 072 — University-level admissions requirements (CSCA, under-18, notes)
-- Safe to re-run.
-- =============================================================================

alter table public.ops_universities
  add column if not exists csca_required text not null default 'unknown';

alter table public.ops_universities
  add column if not exists accepts_under_18 text not null default 'unknown';

alter table public.ops_universities
  add column if not exists requirements_notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ops_universities_csca_required_check'
  ) then
    alter table public.ops_universities
      add constraint ops_universities_csca_required_check
      check (csca_required in ('required', 'not_required', 'optional', 'unknown'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ops_universities_accepts_under_18_check'
  ) then
    alter table public.ops_universities
      add constraint ops_universities_accepts_under_18_check
      check (accepts_under_18 in ('yes', 'no', 'case_by_case', 'unknown'));
  end if;
end $$;
