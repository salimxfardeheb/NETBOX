import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pont photo base64 ⇄ Supabase Storage.
 *
 * Le reste du module (preview, export .docx via dataUrlToImage) ne
 * consomme que des data URL base64 : ces utilitaires convertissent
 * dans les deux sens autour du bucket privé `cv-photos`.
 */

const BUCKET = "cv-photos";
/** Côté max de l'image uploadée, en px (largement assez pour un CV). */
const MAX_SIDE = 512;
const JPEG_QUALITY = 0.85;

/**
 * Compresse une photo (data URL) côté client : redimensionnement à
 * MAX_SIDE max et réencodage JPEG. Retourne un Blob prêt à uploader.
 */
export async function compressPhotoDataUrl(dataUrl: string): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Photo illisible"));
    image.src = dataUrl;
  });

  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  // Fond blanc : le JPEG ne gère pas la transparence (PNG → JPEG).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Compression de la photo impossible");
  return blob;
}

/**
 * Compresse puis uploade la photo dans le bucket privé, sous
 * `{userId}/{cvId}.jpg` (une photo par CV, écrasée à chaque sauvegarde).
 * Les policies Storage n'autorisent l'écriture que dans son propre
 * dossier `{userId}/`. Retourne le chemin, à stocker dans photoPath.
 */
export async function uploadPhoto(
  supabase: SupabaseClient,
  userId: string,
  cvId: string,
  dataUrl: string
): Promise<string> {
  const blob = await compressPhotoDataUrl(dataUrl);
  const path = `${userId}/${cvId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw new Error(`Upload de la photo : ${error.message}`);
  return path;
}

/**
 * Télécharge la photo depuis le Storage et la reconvertit en data URL
 * base64 (`data:image/jpeg;base64,…`), format attendu par CVPreview
 * et par dataUrlToImage (export .docx).
 */
export async function downloadPhotoAsDataUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Téléchargement de la photo : ${error?.message ?? "vide"}`);
  }
  // Force le type MIME si le Storage ne l'a pas fourni, sinon la data URL
  // ne matcherait pas le regex de dataUrlToImage.
  const blob = data.type ? data : new Blob([data], { type: "image/jpeg" });

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Conversion base64 impossible"));
    };
    reader.onerror = () => reject(new Error("Conversion base64 impossible"));
    reader.readAsDataURL(blob);
  });
}
