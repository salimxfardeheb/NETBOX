import type {
  Company,
  DocumentType,
  ModePaiement,
  StatutPaiement,
  Tax,
} from "./types";

/**
 * Constantes de configuration du module Factures.
 * AUCUN taux ni barème ne doit être codé en dur ailleurs (ni dans l'UI,
 * ni dans les calculs) : tout part d'ici, pour rester ajustable si la
 * réglementation change.
 */

/** Taux de TVA algériens proposés dans l'éditeur. */
export const TVA_RATES: Tax[] = [
  { libelle: "TVA 19 %", taux: 19 },
  { libelle: "TVA 9 %", taux: 9 },
  { libelle: "Exonéré (0 %)", taux: 0 },
];

/** Devise par défaut des documents. */
export const DEFAULT_DEVISE = "DZD";

/** Une tranche du barème progressif du droit de timbre. */
export interface StampDutyBracket {
  /** Borne supérieure (incluse) de la tranche, en DA. `null` = sans limite. */
  jusquA: number | null;
  /** Droit en DA par tranche de `trancheDA` entamée. */
  droitParTranche: number;
}

/**
 * DROIT DE TIMBRE (paiement en espèces uniquement).
 * Barème progressif : X DA par tranche de 100 DA entamée, le « X »
 * dépendant de la part du montant dans chaque tranche du barème
 * (~1 % ≤ 30 000 DA, ~1,5 % de 30 000 à 100 000 DA, ~2 % au-delà),
 * avec un minimum de perception.
 */
export const STAMP_DUTY_CONFIG = {
  /** Taille de la tranche d'assiette : 1 droit par tranche de 100 DA entamée. */
  trancheDA: 100,
  /** Barème progressif, tranches ordonnées par borne croissante. */
  bareme: [
    { jusquA: 30_000, droitParTranche: 1 }, // ~1 %
    { jusquA: 100_000, droitParTranche: 1.5 }, // ~1,5 %
    { jusquA: null, droitParTranche: 2 }, // ~2 %
  ] as StampDutyBracket[],
  /** Minimum de perception, en DA. */
  minimumDA: 5,
};

export type StampDutyConfig = typeof STAMP_DUTY_CONFIG;

/** Modes de paiement soumis au droit de timbre. */
export const MODES_AVEC_TIMBRE: ModePaiement[] = ["ESPECES"];

/** Libellés d'affichage des types de document. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  FACTURE: "Facture",
  PROFORMA: "Facture proforma",
  DEVIS: "Devis",
  BON_LIVRAISON: "Bon de livraison",
};

/** Libellés d'affichage des modes de paiement. */
export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement bancaire",
  CHEQUE: "Chèque",
  CARTE: "Carte bancaire",
};

/** Libellés d'affichage des statuts de règlement. */
export const STATUT_LABELS: Record<StatutPaiement, string> = {
  PAYEE: "Payée",
  NON_PAYEE: "Non payée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
};

/** Unités proposées pour les lignes (liste indicative, champ libre). */
export const UNITES = ["U", "Kg", "L", "m", "m²", "m³", "H", "Jour", "Forfait"];

/**
 * Vendeur par défaut pré-rempli dans l'éditeur (modifiable).
 * En étape 2 il deviendra un profil persisté.
 */
export const DEFAULT_COMPANY: Company = {
  raisonSociale: "",
  adresse: "",
  telephone: "",
  email: "",
  nif: "",
  nis: "",
  rc: "",
  articleImposition: "",
  numeroTVA: "",
  assujettiTVA: true,
};
