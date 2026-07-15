-- ============================================================
-- SIMOUX — cv-builder : sauvegarde en ligne d'UN CV par compte.
-- À exécuter tel quel dans le SQL Editor du dashboard Supabase.
-- ============================================================

-- ---------- Table cvs ----------
-- unique (user_id) matérialise la règle "un seul CV par utilisateur"
-- et permet un upsert sur onConflict: user_id côté client.
create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  unique (user_id)
);

-- RLS activée dès la création : chaque ligne n'est visible/modifiable
-- que par son propriétaire.
alter table public.cvs enable row level security;

create policy "cvs_select_own" on public.cvs
  for select using (auth.uid() = user_id);

create policy "cvs_insert_own" on public.cvs
  for insert with check (auth.uid() = user_id);

create policy "cvs_update_own" on public.cvs
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cvs_delete_own" on public.cvs
  for delete using (auth.uid() = user_id);

-- ---------- Bucket privé pour les photos ----------
-- Le Storage a son propre système de policies (sur storage.objects).
-- Convention de chemin : {user_id}/photo.jpg — le premier dossier du
-- chemin DOIT être l'uid de l'utilisateur, c'est ce que vérifient les
-- policies ci-dessous.
insert into storage.buckets (id, name, public)
values ('cv-photos', 'cv-photos', false);

create policy "cv_photos_select_own" on storage.objects
  for select using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
