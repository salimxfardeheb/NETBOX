import { apiFetch } from "@/lib/api-client";
import type { FactureSnapshot } from "./store";

/**
 * Accès à la base partagée des documents, via les routes /api/factures
 * (Prisma → Neon, colonne `data` en JSON). UNIQUEMENT des données JSON :
 * le snapshot complet de l'éditeur tient dans une ligne.
 */

export interface FactureListRow {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * Enregistre le document : met à jour la ligne `docId` si elle existe
 * encore, sinon en crée une. Retourne l'id de la ligne écrite (à garder
 * dans le store pour les sauvegardes suivantes).
 */
export async function saveFacture(
  snapshot: FactureSnapshot,
  title: string,
  docId: string | null
): Promise<string> {
  const { id } = await apiFetch<{ id: string }>("/api/factures", {
    method: "POST",
    body: JSON.stringify({ id: docId, title, data: snapshot }),
  });
  return id;
}

/** Liste tous les documents, du plus récent au plus ancien. */
export async function listFactures(): Promise<FactureListRow[]> {
  const { rows } = await apiFetch<{ rows: FactureListRow[] }>("/api/factures");
  return rows;
}

/** Charge un document par id (snapshot JSON brut). */
export async function loadFacture(
  id: string
): Promise<{ title: string; snapshot: Partial<FactureSnapshot> }> {
  const row = await apiFetch<{
    title: string;
    data: Partial<FactureSnapshot>;
  }>(`/api/factures/${id}`);
  return { title: row.title, snapshot: row.data };
}

/** Supprime un document (une simple ligne — rien d'autre à nettoyer). */
export async function deleteFacture(id: string): Promise<void> {
  await apiFetch(`/api/factures/${id}`, { method: "DELETE" });
}
