import type { Invoice } from "@/lib/invoicing/types";

/**
 * Validation légère avant rendu / export : uniquement la présence des
 * champs obligatoires. Ni unicité de numéro ni attribution définitive —
 * c'est l'étape 2 (persistance).
 */
export function validateInvoice(invoice: Invoice): string[] {
  const errors: string[] = [];
  const { company, customer, items, type } = invoice;

  if (!company.raisonSociale.trim()) {
    errors.push("Vendeur : la raison sociale est obligatoire.");
  }
  if (!company.adresse.trim()) {
    errors.push("Vendeur : l'adresse est obligatoire.");
  }

  // Mentions fiscales obligatoires sur les documents à valeur commerciale.
  if (type === "FACTURE") {
    if (!company.nif.trim()) errors.push("Vendeur : le NIF est obligatoire sur une facture.");
    if (!company.nis.trim()) errors.push("Vendeur : le NIS est obligatoire sur une facture.");
    if (!company.rc.trim()) errors.push("Vendeur : le RC est obligatoire sur une facture.");
    if (!company.articleImposition.trim()) {
      errors.push("Vendeur : l'article d'imposition (AI) est obligatoire sur une facture.");
    }
    if (!/^\d{4}-\d{4}$/.test(invoice.numeroApercu)) {
      errors.push("Le numéro d'aperçu d'une facture doit suivre le format AAAA-NNNN (ex. 2026-0001).");
    }
  }

  if (!customer.raisonSociale.trim()) {
    errors.push("Client : la raison sociale (ou le nom) est obligatoire.");
  }
  if (!customer.adresse.trim()) {
    errors.push("Client : l'adresse est obligatoire.");
  }

  if (!invoice.numeroApercu.trim()) errors.push("Le numéro de document est obligatoire.");
  if (!invoice.dateEmission) errors.push("La date d'émission est obligatoire.");
  if (type === "DEVIS" && !invoice.dateValidite) {
    errors.push("Devis : la date de validité est obligatoire.");
  }

  if (items.length === 0) {
    errors.push("Ajoutez au moins une ligne au document.");
  }
  items.forEach((item, i) => {
    if (!item.designation.trim()) {
      errors.push(`Ligne ${i + 1} : la désignation est obligatoire.`);
    }
    if (item.quantite <= 0) {
      errors.push(`Ligne ${i + 1} : la quantité doit être supérieure à 0.`);
    }
    if (item.prixUnitaireHT < 0) {
      errors.push(`Ligne ${i + 1} : le prix unitaire ne peut pas être négatif.`);
    }
  });

  return errors;
}
