import { Packer } from "docx";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createElement } from "react";
import { templates, type TemplateKey } from "../templates";
import type { CVData } from "./types";
import { CVPreview } from "../components/CVPreview";

/** Nom de fichier (sans extension) dérivé du prénom/nom du CV. */
function fileBaseName(data: CVData): string {
  return (
    [data.basics.firstName, data.basics.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("-")
      .replace(/[^\p{L}\p{N}-]+/gu, "_") || "sans-nom"
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Génère le .docx du template choisi et déclenche son téléchargement.
 * À appeler uniquement côté client (utilise Blob + DOM).
 */
export async function exportToWord(
  data: CVData,
  templateKey: TemplateKey
): Promise<void> {
  const doc = await templates[templateKey].build(data);
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `CV-${fileBaseName(data)}.docx`);
}

/**
 * Génère le .pdf en rasterisant un rendu hors-écran de l'aperçu (CVPreview)
 * à sa taille réelle A4 (donc indépendant de l'échelle affichée à l'écran),
 * puis en découpant l'image en pages A4 successives.
 * À appeler uniquement côté client (utilise le DOM + Canvas).
 */
export async function exportToPdf(data: CVData): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Rendu hors-écran, à la largeur A4 exacte (595px) pour forcer l'échelle
  // d'aperçu k = 1, quelle que soit la taille de la fenêtre de l'utilisateur.
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "-10000px";
  host.style.width = "595px";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    // Rendu synchrone : on ne dépend pas de requestAnimationFrame, qui peut
    // rester en attente indéfiniment sur un onglet en arrière-plan.
    flushSync(() => {
      root.render(createElement(CVPreview, { data }));
    });

    const images = Array.from(host.querySelectorAll("img"));
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );

    const sheet = host.querySelector<HTMLElement>("[data-cv-sheet]");
    if (!sheet) return;

    // Coins carrés et pas d'ombre pour l'export : le rendu écran a des coins
    // arrondis + une ombre portée (esthétique d'aperçu), qu'on ne veut pas
    // dans le PDF (page A4 nette, bord à bord).
    sheet.style.borderRadius = "0";
    sheet.style.boxShadow = "none";

    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidthPt = pdf.internal.pageSize.getWidth();
    const pageHeightPt = pdf.internal.pageSize.getHeight();
    const pxPerPt = canvas.width / pageWidthPt;
    const pageHeightPx = pageHeightPt * pxPerPt;
    // Tolérance : `minHeight: A4_H` (842) dans l'aperçu et la hauteur A4 pt
    // exacte (841.89) ne coïncident pas au pixel près une fois rastérisés,
    // ce qui ajoutait une page quasi vide en fin de document pour un CV
    // tenant sur une seule page. On absorbe ce dépassement infime dans la
    // dernière page plutôt que de créer une page pour quelques pixels.
    const overflowTolerancePx = 24;
    const pageCount = Math.max(
      1,
      Math.ceil((canvas.height - overflowTolerancePx) / pageHeightPx)
    );

    for (let i = 0; i < pageCount; i++) {
      const startPx = Math.round(i * pageHeightPx);
      // Dernière page : on prend tout le reste (absorbe la tolérance), les
      // pages intermédiaires font une hauteur A4 pleine.
      const sliceHeightPx =
        i === pageCount - 1 ? canvas.height - startPx : Math.round(pageHeightPx);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeightPx;
      const ctx = slice.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(
        canvas,
        0,
        startPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      if (i > 0) pdf.addPage();
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        pageWidthPt,
        sliceHeightPx / pxPerPt
      );
    }

    pdf.save(`CV-${fileBaseName(data)}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}
