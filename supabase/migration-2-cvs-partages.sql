-- ============================================================
-- Migration 2 — base centralisée multi-CV.
-- À exécuter dans le SQL Editor Supabase (après schema.sql).
--
-- Changements :
--   * plusieurs CV par compte (suppression du unique(user_id)) ;
--   * tout utilisateur CONNECTÉ peut lire/modifier/supprimer
--     n'importe quel CV (base partagée) ;
--   * les photos sont lisibles par tout utilisateur connecté,
--     mais chacun n'écrit que dans son propre dossier.
-- Les visiteurs non connectés n'ont toujours accès à rien.
-- ============================================================

-- Plusieurs CV par compte.
alter table public.cvs drop constraint if exists cvs_user_id_key;

-- ---------- Table cvs : lecture/écriture partagées ----------
drop policy if exists "cvs_select_own" on public.cvs;
drop policy if exists "cvs_update_own" on public.cvs;
drop policy if exists "cvs_delete_own" on public.cvs;
-- (cvs_insert_own est conservée : on crée toujours en son nom.)

create policy "cvs_select_shared" on public.cvs
  for select to authenticated using (true);

create policy "cvs_update_shared" on public.cvs
  for update to authenticated using (true) with check (true);

create policy "cvs_delete_shared" on public.cvs
  for delete to authenticated using (true);

-- ---------- Storage : photos lisibles par tous les connectés ----------
drop policy if exists "cv_photos_select_own" on storage.objects;

create policy "cv_photos_select_shared" on storage.objects
  for select to authenticated using (bucket_id = 'cv-photos');
-- (insert/update/delete restent limités au dossier {uid}/ de chacun.)
