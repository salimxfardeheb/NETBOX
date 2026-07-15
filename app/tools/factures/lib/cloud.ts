import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { FactureSnapshot } from "./store";

/**
 * Accès à la base partagée des documents (table `factures`, jsonb).
 * UNIQUEMENT des données JSON — aucun fichier en Storage : le snapshot
 * complet de l'éditeur tient dans la colonne `data`.
 */

export interface FactureListRow {
  id: string;
  title: string;
  updated_at: string;
}

/**
 * Enregistre le document : met à jour la ligne `docId` si elle existe
 * encore, sinon en crée une. Retourne l'id de la ligne écrite (à garder
 * dans le store pour les sauvegardes suivantes).
 */
export async function saveFacture(
  supabase: SupabaseClient,
  session: Session,
  snapshot: FactureSnapshot,
  title: string,
  docId: string | null
): Promise<string> {
  if (docId) {
    const { data: rows, error } = await supabase
      .from("factures")
      .update({ title, data: snapshot, updated_at: new Date().toISOString() })
      .eq("id", docId)
      .select("id");
    if (error) throw new Error(error.message);
    // Ligne encore présente : mise à jour faite. Sinon (document supprimé
    // entre-temps), on retombe sur une création ci-dessous.
    if (rows && rows.length > 0) return docId;
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from("factures").insert({
    id,
    user_id: session.user.id,
    title,
    data: snapshot,
  });
  if (error) throw new Error(error.message);
  return id;
}

/** Liste tous les documents, du plus récent au plus ancien. */
export async function listFactures(
  supabase: SupabaseClient
): Promise<FactureListRow[]> {
  const { data, error } = await supabase
    .from("factures")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FactureListRow[];
}

/** Charge un document par id (snapshot JSON brut). */
export async function loadFacture(
  supabase: SupabaseClient,
  id: string
): Promise<{ title: string; snapshot: Partial<FactureSnapshot> }> {
  const { data: row, error } = await supabase
    .from("factures")
    .select("title, data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Document introuvable (supprimé ?)");
  return {
    title: row.title as string,
    snapshot: row.data as Partial<FactureSnapshot>,
  };
}

/** Supprime un document (une simple ligne — rien d'autre à nettoyer). */
export async function deleteFacture(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("factures").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
