-- =============================================================================
-- MIGRATION 071 — Public storage bucket for ops university logos
-- Admins upload; anyone can read (logo_url stored as public URL on ops_universities).
-- Safe to re-run.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ops-university-logos',
  'ops-university-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read ops-university-logos" on storage.objects;
create policy "Public read ops-university-logos"
  on storage.objects for select
  using (bucket_id = 'ops-university-logos');

drop policy if exists "Sallam admin upload ops-university-logos" on storage.objects;
create policy "Sallam admin upload ops-university-logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ops-university-logos'
    and public.is_sallam_admin()
  );

drop policy if exists "Sallam admin update ops-university-logos" on storage.objects;
create policy "Sallam admin update ops-university-logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ops-university-logos'
    and public.is_sallam_admin()
  )
  with check (
    bucket_id = 'ops-university-logos'
    and public.is_sallam_admin()
  );

drop policy if exists "Sallam admin delete ops-university-logos" on storage.objects;
create policy "Sallam admin delete ops-university-logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ops-university-logos'
    and public.is_sallam_admin()
  );
