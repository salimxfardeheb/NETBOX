/**
 * Compression de la photo du CV, côté navigateur.
 *
 * Toute la chaîne (preview, export .docx via dataUrlToImage) consomme
 * des data URL base64 : la photo est simplement réencodée plus petite
 * avant d'être enregistrée dans le JSON du CV — il n'y a plus de
 * stockage de fichiers séparé.
 */

/** Côté max de l'image enregistrée, en px (largement assez pour un CV). */
const MAX_SIDE = 512;
const JPEG_QUALITY = 0.85;

/**
 * Redimensionne à MAX_SIDE max et réencode en JPEG.
 * Retourne une data URL `data:image/jpeg;base64,…`.
 */
export async function compressPhotoDataUrl(dataUrl: string): Promise<string> {
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

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
