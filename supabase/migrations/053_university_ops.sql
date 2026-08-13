-- =============================================================================
-- MIGRATION 053 — University Operations (canonical ops_* model)
-- Additive only. Does not delete or rename existing pipeline/partner tables.
-- Run in ops Supabase SQL editor (aqolvmigpihjrpwgkzbw).
-- =============================================================================

-- Ensure admin helper exists (from 021)
create or replace function public.is_sallam_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- ── 1. ops_universities (canonical identity) ─────────────────────────────────

create table if not exists public.ops_universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chinese_name text,
  short_name text,
  slug text,
  city text,
  province text,
  country text not null default 'China',
  university_type text,
  website text,
  logo_url text,
  public_visibility boolean not null default false,
  record_source text not null default 'manual'
    check (record_source in ('research', 'pipeline_import', 'partner_import', 'web_catalog', 'manual')),
  public_catalog_slug text,
  ranking_notes text,
  description text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_ops_universities_slug
  on public.ops_universities (slug)
  where slug is not null;

create unique index if not exists idx_ops_universities_public_catalog_slug
  on public.ops_universities (public_catalog_slug)
  where public_catalog_slug is not null;

create index if not exists idx_ops_universities_name_lower
  on public.ops_universities (lower(name));

-- ── 2. ops_partnerships ──────────────────────────────────────────────────────

create table if not exists public.ops_partnerships (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.ops_universities(id) on delete cascade,
  status text not null default 'research'
    check (status in (
      'research', 'contacted', 'replied', 'negotiating',
      'partner', 'active', 'inactive', 'archived'
    )),
  works_with_agencies boolean,
  has_agreement boolean not null default false,
  commission_notes text,
  recruitment_notes text,
  owner_staff_id uuid references public.profiles(id) on delete set null,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id)
);

create index if not exists idx_ops_partnerships_status
  on public.ops_partnerships (status);

create index if not exists idx_ops_partnerships_follow_up
  on public.ops_partnerships (next_follow_up_at)
  where next_follow_up_at is not null;

-- ── 3. ops_programs ──────────────────────────────────────────────────────────

create table if not exists public.ops_programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.ops_universities(id) on delete cascade,
  name text not null,
  degree_type text,
  teaching_language text,
  major_category text,
  duration text,
  tuition_guide numeric,
  accommodation_guide numeric,
  application_fee numeric,
  currency text default 'CNY',
  language_requirements text,
  academic_requirements text,
  other_requirements text,
  info_source text,
  source_url text,
  last_verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verification_notes text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, name, degree_type)
);

create index if not exists idx_ops_programs_university
  on public.ops_programs (university_id);

-- ── 4. ops_offers (historical — one row per program × intake) ────────────────

create table if not exists public.ops_offers (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.ops_programs(id) on delete cascade,
  university_id uuid not null references public.ops_universities(id) on delete cascade,
  intake text not null,
  academic_year text,
  tuition numeric,
  currency text default 'CNY',
  scholarship_type text,
  scholarship_notes text,
  deadline date,
  application_method text,
  availability_notes text,
  status text not null default 'potential'
    check (status in ('potential', 'verifying', 'active', 'closed', 'expired')),
  info_source text,
  source_url text,
  last_verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verification_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ops_offers_status on public.ops_offers (status);
create index if not exists idx_ops_offers_intake on public.ops_offers (intake);
create index if not exists idx_ops_offers_deadline on public.ops_offers (deadline)
  where deadline is not null;
create index if not exists idx_ops_offers_university on public.ops_offers (university_id);
create index if not exists idx_ops_offers_program on public.ops_offers (program_id);

create unique index if not exists idx_ops_offers_program_intake
  on public.ops_offers (program_id, intake);

-- ── 5. ops_university_contacts ───────────────────────────────────────────────

create table if not exists public.ops_university_contacts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.ops_universities(id) on delete cascade,
  name text not null,
  position text,
  department text,
  email text,
  wechat text,
  phone text,
  contact_type text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ops_contacts_university
  on public.ops_university_contacts (university_id);

create index if not exists idx_ops_contacts_follow_up
  on public.ops_university_contacts (next_follow_up_at)
  where next_follow_up_at is not null;

-- ── 6. ops_university_documents ──────────────────────────────────────────────

create table if not exists public.ops_university_documents (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.ops_universities(id) on delete cascade,
  title text not null,
  doc_type text,
  storage_path text,
  source_url text,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ops_documents_university
  on public.ops_university_documents (university_id);

-- ── 7. Compatibility FKs (non-breaking) ──────────────────────────────────────

alter table public.partner_universities
  add column if not exists ops_university_id uuid
    references public.ops_universities(id) on delete set null;

create index if not exists idx_partner_universities_ops
  on public.partner_universities (ops_university_id)
  where ops_university_id is not null;

alter table public.pipeline_universities
  add column if not exists ops_university_id uuid
    references public.ops_universities(id) on delete set null;

create index if not exists idx_pipeline_universities_ops
  on public.pipeline_universities (ops_university_id)
  where ops_university_id is not null;

alter table public.pipeline_student_applications
  add column if not exists ops_offer_id uuid
    references public.ops_offers(id) on delete set null;

alter table public.pipeline_student_applications
  add column if not exists offer_snapshot jsonb;

create index if not exists idx_pipeline_apps_ops_offer
  on public.pipeline_student_applications (ops_offer_id)
  where ops_offer_id is not null;

-- ── 8. updated_at triggers ───────────────────────────────────────────────────

create or replace function public.set_ops_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger trg_ops_universities_updated
    before update on public.ops_universities
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_ops_partnerships_updated
    before update on public.ops_partnerships
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_ops_programs_updated
    before update on public.ops_programs
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_ops_offers_updated
    before update on public.ops_offers
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_ops_contacts_updated
    before update on public.ops_university_contacts
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_ops_documents_updated
    before update on public.ops_university_documents
    for each row execute function public.set_ops_updated_at();
exception when duplicate_object then null; end $$;

-- ── 9. RLS — Sallam admin only (partners get zero access) ────────────────────

alter table public.ops_universities enable row level security;
alter table public.ops_partnerships enable row level security;
alter table public.ops_programs enable row level security;
alter table public.ops_offers enable row level security;
alter table public.ops_university_contacts enable row level security;
alter table public.ops_university_documents enable row level security;

drop policy if exists "Sallam admin all ops_universities" on public.ops_universities;
create policy "Sallam admin all ops_universities"
  on public.ops_universities for all
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

drop policy if exists "Sallam admin all ops_partnerships" on public.ops_partnerships;
create policy "Sallam admin all ops_partnerships"
  on public.ops_partnerships for all
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

drop policy if exists "Sallam admin all ops_programs" on public.ops_programs;
create policy "Sallam admin all ops_programs"
  on public.ops_programs for all
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

drop policy if exists "Sallam admin all ops_offers" on public.ops_offers;
create policy "Sallam admin all ops_offers"
  on public.ops_offers for all
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

drop policy if exists "Sallam admin all ops_university_contacts" on public.ops_university_contacts;
create policy "Sallam admin all ops_university_contacts"
  on public.ops_university_contacts for all
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

drop policy if exists "Sallam admin all ops_university_documents" on public.ops_university_documents;
create policy "Sallam admin all ops_university_documents"
  on public.ops_university_documents for all
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

comment on table public.ops_universities is
  'Canonical Sallam university identity (University Ops SoT). Not the partner portal registry.';
comment on table public.ops_offers is
  'Historical intake opportunities. One row per program × intake; never overwrite past intakes.';
comment on column public.pipeline_student_applications.offer_snapshot is
  'Immutable full application context at link time: university, program, intake, tuition, scholarship, deadline, requirements, offer status, verification. Survives later offer/program edits.';
comment on column public.pipeline_student_applications.ops_offer_id is
  'Primary ops link when application came from University Ops matching.';
