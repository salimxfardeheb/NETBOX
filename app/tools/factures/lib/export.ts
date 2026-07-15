import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { InvoiceTotals } from "@/lib/invoicing/calculations";
import type { Invoice } from "@/lib/invoicing/types";
import { InvoicePreview } from "../components/InvoicePreview";
import type { ColonnesVisibles } from "./store";

/** Nom de fichier dérivé du type + numéro d'aperçu. */
function fileBaseName(invoice: Invoice): string {
  return `${invoice.type}-${invoice.numeroApercu}`.replace(
    /[^\p{L}\p{N}-]+/gu,
    "_"
  );
}

/**
 * Rastérise le document (InvoicePreview rendu hors écran à la largeur A4
 * exacte, donc échelle 1 quelle que soit la fenêtre) et le découpe en pages
 * A4 dans un jsPDF. Même mécanique que l'export du module CV, mais copie
 * locale : les modules restent hermétiques. À appeler côté client uniquement.
 */
async function renderInvoicePdf(
  invoice: Invoice,
  totals: InvoiceTotals,
  afficherPrix: boolean,
  colonnes: ColonnesVisibles
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "-10000px";
  host.style.width = "595px";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    // Rendu synchrone : pas de requestAnimationFrame (peut ne jamais venir
    // sur un onglet en arrière-plan).
    flushSync(() => {
      root.render(
        createElement(InvoicePreview, { invoice, totals, afficherPrix, colonnes })
      );
    });

    const sheet = host.querySelector<HTMLElement>("[data-invoice-sheet]");
    if (!sheet) throw new Error("Feuille du document introuvable pour l'export.");

    // Coins carrés et pas d'ombre dans le PDF (page nette, bord à bord).
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
    // Absorbe l'écart infime entre minHeight 842 px et la hauteur A4 pt
    // exacte (841,89) pour ne pas générer une dernière page quasi vide.
    const overflowTolerancePx = 24;
    const pageCount = Math.max(
      1,
      Math.ceil((canvas.height - overflowTolerancePx) / pageHeightPx)
    );

    for (let i = 0; i < pageCount; i++) {
      const startPx = Math.round(i * pageHeightPx);
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

    return pdf;
  } finally {
    root.unmount();
    host.remove();
  }
}

/** Génère le PDF du document courant et déclenche son téléchargement. */
export async function exportInvoicePdf(
  invoice: Invoice,
  totals: InvoiceTotals,
  afficherPrix: boolean,
  colonnes: ColonnesVisibles
): Promise<void> {
  const pdf = await renderInvoicePdf(invoice, totals, afficherPrix, colonnes);
  pdf.save(`${fileBaseName(invoice)}.pdf`);
}

/**
 * Impression : ouvre le PDF dans un onglet avec la boîte d'impression
 * pré-déclenchée (autoPrint) — rendu strictement identique à l'export.
 */
export async function printInvoice(
  invoice: Invoice,
  totals: InvoiceTotals,
  afficherPrix: boolean,
  colonnes: ColonnesVisibles
): Promise<void> {
  const pdf = await renderInvoicePdf(invoice, totals, afficherPrix, colonnes);
  pdf.autoPrint();
  window.open(pdf.output("bloburl"), "_blank");
}
