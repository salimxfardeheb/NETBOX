import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { CVData } from "./types";
import { downloadPhotoAsDataUrl, uploadPhoto } from "./photoStorage";

/**
 * Accès à la base partagée des CVs (table `cvs`, jsonb).
 * Utilisé par CloudControls (enregistrer) et la page liste
 * (lister / ouvrir / supprimer). La photo transite par le pont
 * base64 ⇄ Storage de photoStorage.ts.
 */

export interface CVListRow {
  id: string;
  title: string;
  updated_at: string;
}

/**
 * Enregistre le CV : met à jour la ligne `cvId` si elle existe encore,
 * sinon en crée une. Retourne l'id de la ligne écrite (à garder dans
 * le store pour les sauvegardes suivantes).
 */
export async function saveCV(
  supabase: SupabaseClient,
  session: Session,
  data: CVData,
  title: string,
  cvId: string | null
): Promise<string> {
  const id = cvId ?? crypto.randomUUID();

  // Copie profonde : on ne modifie jamais le store, seulement le JSON
  // envoyé (photo base64 remplacée par son chemin Storage).
  const payload = JSON.parse(JSON.stringify(data)) as CVData;
  if (payload.basics.photo?.startsWith("data:")) {
    payload.basics.photoPath = await uploadPhoto(
      supabase,
      session.user.id,
      id,
      payload.basics.photo
    );
    delete payload.basics.photo;
  } else {
    delete payload.basics.photoPath;
  }

  if (cvId) {
    const { data: rows, error } = await supabase
      .from("cvs")
      .update({ title, data: payload, updated_at: new Date().toISOString() })
      .eq("id", cvId)
      .select("id");
    if (error) throw new Error(error.message);
    // Ligne encore présente : mise à jour faite. Sinon (CV supprimé
    // entre-temps), on retombe sur une création ci-dessous.
    if (rows && rows.length > 0) return cvId;
  }

  const { error } = await supabase.from("cvs").insert({
    id,
    user_id: session.user.id,
    title,
    data: payload,
  });
  if (error) throw new Error(error.message);
  return id;
}

/** Liste tous les CVs de la base partagée, du plus récent au plus ancien. */
export async function listCVs(supabase: SupabaseClient): Promise<CVListRow[]> {
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CVListRow[];
}

/**
 * Charge un CV par id : photo retéléchargée depuis le Storage et
 * réinjectée en base64 dans basics.photo (format attendu par le
 * preview et l'export .docx).
 */
export async function loadCV(
  supabase: SupabaseClient,
  id: string
): Promise<{ title: string; data: CVData }> {
  const { data: row, error } = await supabase
    .from("cvs")
    .select("title, data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("CV introuvable (supprimé ?)");

  const cv = row.data as CVData;
  if (cv.basics.photoPath) {
    cv.basics.photo = await downloadPhotoAsDataUrl(supabase, cv.basics.photoPath);
  }
  delete cv.basics.photoPath;
  return { title: row.title as string, data: cv };
}

/** Supprime un CV et, si possible, sa photo dans le Storage. */
export async function deleteCV(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { data: row } = await supabase
    .from("cvs")
    .select("photoPath:data->basics->>photoPath")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("cvs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  // Nettoyage best-effort : la policy Storage ne permet de supprimer
  // que dans son propre dossier — on ignore l'échec pour les autres.
  const photoPath = (row as { photoPath?: string } | null)?.photoPath;
  if (photoPath) {
    await supabase.storage.from("cv-photos").remove([photoPath]);
  }
}
