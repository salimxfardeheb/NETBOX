import { Packer } from "docx";
import { templates, type TemplateKey } from "../templates";
import type { CVData } from "./types";

/**
 * Génère le .docx du template choisi et déclenche son téléchargement.
 * À appeler uniquement côté client (utilise Blob + DOM).
 */
export async function exportToWord(
  data: CVData,
  templateKey: TemplateKey
): Promise<void> {
  const doc = templates[templateKey].build(data);
  const blob = await Packer.toBlob(doc);

  const name =
    [data.basics.firstName, data.basics.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("-")
      .replace(/[^\p{L}\p{N}-]+/gu, "_") || "sans-nom";

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `CV-${name}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
