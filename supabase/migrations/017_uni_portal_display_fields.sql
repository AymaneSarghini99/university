-- Migration 017 — University portal display fields + admin interest notifications
-- Run in Supabase SQL editor for the docs/ops project.
-- Does not modify docs application code.

-- 1. Extend marketplace profiles with publishable display fields
alter table public.student_marketplace_profiles
  add column if not exists full_name text,
  add column if not exists nationality text,
  add column if not exists photo_url text,
  add column if not exists documents jsonb not null default '{}'::jsonb;

comment on column public.student_marketplace_profiles.full_name is
  'Display name shown to partner universities when profile is visible';
comment on column public.student_marketplace_profiles.nationality is
  'Nationality shown to partner universities when profile is visible';
comment on column public.student_marketplace_profiles.photo_url is
  'Public photo URL for partner portal cards and profile pages';
comment on column public.student_marketplace_profiles.documents is
  'Public document URLs: { passport, transcript, certificates }';

-- 2. Admin notification queue for partner interest events
create table if not exists public.partner_interest_notifications (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.partner_universities(id) on delete cascade,
  student_id uuid not null references public.student_marketplace_profiles(id) on delete cascade,
  shortlist_id uuid references public.university_shortlists(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'seen', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_partner_interest_notifications_status
  on public.partner_interest_notifications(status, created_at desc);

alter table public.partner_interest_notifications enable row level security;

create policy "sallam_admin_manage_partner_interest_notifications"
  on public.partner_interest_notifications for all
  to authenticated
  using (public.is_sallam_admin())
  with check (public.is_sallam_admin());

-- Universities can insert via trigger only; no direct read required for MVP
create policy "uni_insert_partner_interest_notifications"
  on public.partner_interest_notifications for insert
  to authenticated
  with check (university_id = public.my_university_id());

-- 3. Notify Sallam admin when a university marks a student as interested
create or replace function public.notify_sallam_on_university_interest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'interested' then
    insert into public.partner_interest_notifications (university_id, student_id, shortlist_id)
    values (new.university_id, new.student_id, new.id);
  elsif tg_op = 'UPDATE' and new.status = 'interested' and old.status is distinct from 'interested' then
    insert into public.partner_interest_notifications (university_id, student_id, shortlist_id)
    values (new.university_id, new.student_id, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_sallam_on_university_interest on public.university_shortlists;

create trigger trg_notify_sallam_on_university_interest
  after insert or update of status on public.university_shortlists
  for each row
  execute function public.notify_sallam_on_university_interest();
