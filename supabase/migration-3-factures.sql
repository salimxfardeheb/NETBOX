-- ============================================================
-- Migration 3 — module Factures : sauvegarde des documents.
-- À exécuter dans le SQL Editor Supabase (après schema.sql et
-- migration-2-cvs-partages.sql).
--
-- Principe : UNIQUEMENT des données JSON (colonne jsonb) — aucun
-- bucket Storage. Mêmes règles de partage que les CVs : tout
-- utilisateur connecté lit/modifie/supprime, chacun crée en son nom.
-- ============================================================

create table public.factures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  -- Snapshot JSON complet de l'éditeur (document + préférences d'affichage).
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.factures enable row level security;

create policy "factures_select_shared" on public.factures
  for select to authenticated using (true);

create policy "factures_insert_own" on public.factures
  for insert with check (auth.uid() = user_id);

create policy "factures_update_shared" on public.factures
  for update to authenticated using (true) with check (true);

create policy "factures_delete_shared" on public.factures
  for delete to authenticated using (true);
