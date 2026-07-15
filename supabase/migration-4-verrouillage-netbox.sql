-- ============================================================
-- Migration 4 — verrouillage : seul le compte "netbox" accède
-- aux données (CVs, photos, factures).
-- À exécuter dans le SQL Editor Supabase (après migration-3).
--
-- IMPORTANT — à faire aussi dans le dashboard Supabase :
--   Authentication → Sign In / Up → désactiver
--   « Allow new users to sign up ». Sans ça, n'importe qui peut
--   encore créer un compte via l'API même si le bouton a disparu
--   de l'interface.
-- ============================================================

-- Identifie le compte autorisé par son email synthétique
-- (pseudo "netbox", cf. lib/auth/pseudo.ts).
create or replace function public.is_netbox()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') = 'salimfardeheb442+netbox@gmail.com'
$$;

-- ---------- Table cvs : accès réservé à netbox ----------
drop policy if exists "cvs_select_shared" on public.cvs;
drop policy if exists "cvs_update_shared" on public.cvs;
drop policy if exists "cvs_delete_shared" on public.cvs;
drop policy if exists "cvs_insert_own" on public.cvs;

create policy "cvs_select_netbox" on public.cvs
  for select to authenticated using (public.is_netbox());

create policy "cvs_insert_netbox" on public.cvs
  for insert to authenticated
  with check (public.is_netbox() and auth.uid() = user_id);

create policy "cvs_update_netbox" on public.cvs
  for update to authenticated
  using (public.is_netbox()) with check (public.is_netbox());

create policy "cvs_delete_netbox" on public.cvs
  for delete to authenticated using (public.is_netbox());

-- ---------- Table factures : accès réservé à netbox ----------
drop policy if exists "factures_select_shared" on public.factures;
drop policy if exists "factures_insert_own" on public.factures;
drop policy if exists "factures_update_shared" on public.factures;
drop policy if exists "factures_delete_shared" on public.factures;

create policy "factures_select_netbox" on public.factures
  for select to authenticated using (public.is_netbox());

create policy "factures_insert_netbox" on public.factures
  for insert to authenticated
  with check (public.is_netbox() and auth.uid() = user_id);

create policy "factures_update_netbox" on public.factures
  for update to authenticated
  using (public.is_netbox()) with check (public.is_netbox());

create policy "factures_delete_netbox" on public.factures
  for delete to authenticated using (public.is_netbox());

-- ---------- Storage : photos réservées à netbox ----------
drop policy if exists "cv_photos_select_shared" on storage.objects;
drop policy if exists "cv_photos_insert_own" on storage.objects;
drop policy if exists "cv_photos_update_own" on storage.objects;
drop policy if exists "cv_photos_delete_own" on storage.objects;

create policy "cv_photos_select_netbox" on storage.objects
  for select to authenticated
  using (bucket_id = 'cv-photos' and public.is_netbox());

create policy "cv_photos_insert_netbox" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cv-photos' and public.is_netbox());

create policy "cv_photos_update_netbox" on storage.objects
  for update to authenticated
  using (bucket_id = 'cv-photos' and public.is_netbox())
  with check (bucket_id = 'cv-photos' and public.is_netbox());

create policy "cv_photos_delete_netbox" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cv-photos' and public.is_netbox());
