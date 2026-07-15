import type { Invoice } from "@/lib/invoicing/types";

/**
 * Rappels NON bloquants : tous les champs sont facultatifs, l'utilisateur
 * garde la liberté d'imprimer / exporter un document incomplet. Cette liste
 * signale simplement les mentions habituellement attendues (notamment les
 * mentions fiscales d'une facture) à titre informatif.
 */
export function invoiceWarnings(invoice: Invoice): string[] {
  const warnings: string[] = [];
  const { company, customer, items, type } = invoice;

  if (!company.raisonSociale.trim()) {
    warnings.push("Vendeur : raison sociale non renseignée.");
  }

  // Mentions fiscales attendues sur une facture définitive.
  if (type === "FACTURE") {
    const fiscales: [string, string][] = [
      [company.nif, "NIF"],
      [company.nis, "NIS"],
      [company.rc, "RC"],
      [company.articleImposition, "article d'imposition (AI)"],
    ];
    for (const [valeur, label] of fiscales) {
      if (!valeur.trim()) {
        warnings.push(`Vendeur : ${label} non renseigné (mention fiscale usuelle sur une facture).`);
      }
    }
    if (invoice.numeroApercu.trim() && !/^\d{4}-\d{4}$/.test(invoice.numeroApercu)) {
      warnings.push("Numéro d'aperçu : format habituel AAAA-NNNN (ex. 2026-0001).");
    }
  }

  if (!customer.raisonSociale.trim()) {
    warnings.push("Client : nom / raison sociale non renseigné.");
  }

  if (type === "DEVIS" && !invoice.dateValidite) {
    warnings.push("Devis : date de validité non renseignée.");
  }

  if (items.length === 0) {
    warnings.push("Le document ne contient aucune ligne.");
  }

  return warnings;
}
