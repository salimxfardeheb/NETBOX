import { apiFetch } from "@/lib/api-client";
import type { CVData } from "./types";
import { compressPhotoDataUrl } from "./photo";

/**
 * Accès à la base partagée des CVs, via les routes /api/cvs
 * (Prisma → Neon, colonne `data` en JSON).
 * Utilisé par CloudControls (enregistrer) et la page liste
 * (lister / ouvrir / supprimer).
 */

export interface CVListRow {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * Enregistre le CV : met à jour la ligne `cvId` si elle existe encore,
 * sinon en crée une. Retourne l'id de la ligne écrite (à garder dans
 * le store pour les sauvegardes suivantes).
 */
export async function saveCV(
  data: CVData,
  title: string,
  cvId: string | null
): Promise<string> {
  // Copie profonde : on ne modifie jamais le store, seulement le JSON
  // envoyé (photo recompressée pour alléger la ligne).
  const payload = JSON.parse(JSON.stringify(data)) as CVData;
  if (payload.basics.photo?.startsWith("data:")) {
    payload.basics.photo = await compressPhotoDataUrl(payload.basics.photo);
  }

  const { id } = await apiFetch<{ id: string }>("/api/cvs", {
    method: "POST",
    body: JSON.stringify({ id: cvId, title, data: payload }),
  });
  return id;
}

/** Liste tous les CVs de la base partagée, du plus récent au plus ancien. */
export async function listCVs(): Promise<CVListRow[]> {
  const { rows } = await apiFetch<{ rows: CVListRow[] }>("/api/cvs");
  return rows;
}

/** Charge un CV par id (photo comprise, déjà en base64 dans le JSON). */
export async function loadCV(
  id: string
): Promise<{ title: string; data: CVData }> {
  return await apiFetch<{ title: string; data: CVData }>(`/api/cvs/${id}`);
}

/** Supprime un CV. */
export async function deleteCV(id: string): Promise<void> {
  await apiFetch(`/api/cvs/${id}`, { method: "DELETE" });
}
