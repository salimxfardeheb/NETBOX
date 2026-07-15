/**
 * Types du module Factures — documents commerciaux algériens.
 *
 * ÉTAPE 1 : tout vit en mémoire (state React). Ces types sont conçus pour
 * correspondre au futur schéma SQLite (étape 2) : champs scalaires, dates en
 * ISO 8601 (string), pas de types non sérialisables. Le branchement DB devra
 * être un simple mapping 1:1.
 */

/** Type de document commercial. */
export type DocumentType = "FACTURE" | "PROFORMA" | "DEVIS" | "BON_LIVRAISON";

/** Mode de paiement — conditionne le droit de timbre (espèces uniquement). */
export type ModePaiement = "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE";

/** Statut de règlement du document. */
export type StatutPaiement = "PAYEE" | "NON_PAYEE" | "PARTIELLEMENT_PAYEE";

/** Nature de la remise appliquée à une ligne. */
export type RemiseType = "POURCENT" | "MONTANT";

/**
 * Mode de calcul de la TVA :
 * PAR_LIGNE — chaque produit a son taux, la TVA est sommée ligne à ligne ;
 * GLOBALE — un taux unique appliqué au total HT du document.
 */
export type TvaMode = "PAR_LIGNE" | "GLOBALE";

/** Vendeur — mentions fiscales obligatoires en Algérie (NIF/NIS/RC/AI). */
export interface Company {
  raisonSociale: string;
  adresse: string;
  telephone: string;
  email: string;
  nif: string;
  nis: string;
  rc: string;
  articleImposition: string;
  numeroTVA?: string;
  assujettiTVA: boolean;
}

/** Client — saisie manuelle en étape 1 (bibliothèque persistée en étape 2). */
export interface Customer {
  raisonSociale: string;
  adresse: string;
  nif?: string;
  telephone?: string;
  email?: string;
}

/** Un taux de taxe (ex. TVA 19 %, 9 %, 0 %). */
export interface Tax {
  libelle: string;
  /** Taux en pourcentage (19, 9, 0…). */
  taux: number;
}

/**
 * Partie « saisie » d'une ligne de document — ce que l'utilisateur tape.
 * Les montants calculés vivent dans `InvoiceItem`.
 */
export interface InvoiceItemInput {
  designation: string;
  reference?: string;
  quantite: number;
  unite: string;
  prixUnitaireHT: number;
  remiseType: RemiseType;
  remiseValeur: number;
  /** Taux de TVA en % appliqué à la ligne. */
  taux: number;
}

/** Ligne complète : saisie + montants calculés (par lib/invoicing/calculations). */
export interface InvoiceItem extends InvoiceItemInput {
  /** HT après remise : quantite × prixUnitaireHT − remise. */
  montantHT: number;
  montantRemise: number;
  montantTVA: number;
  montantTTC: number;
}

/** Document commercial complet (facture, proforma, devis, bon de livraison). */
export interface Invoice {
  type: DocumentType;
  /**
   * Numéro d'aperçu PROVISOIRE — l'attribution
   * définitive (séquence persistée, unicité) est l'étape 2.
   * Format facture : AAAA-NNNN.
   */
  numeroApercu: string;
  company: Company;
  customer: Customer;
  /** Dates au format ISO (AAAA-MM-JJ) — compatible SQLite. */
  dateEmission: string;
  dateEcheance?: string;
  /** Devis uniquement : date de fin de validité de l'offre. */
  dateValidite?: string;
  modePaiement: ModePaiement;
  statut: StatutPaiement;
  /** Devise ISO 4217 — « DZD » par défaut. */
  devise: string;
  items: InvoiceItem[];
  notes?: string;
  /** Acompte déjà versé, saisi manuellement en étape 1. */
  acompte: number;
  /**
   * Droit de timbre FACULTATIF : appliqué seulement si vrai ET paiement en
   * espèces (les autres modes en sont exonérés dans tous les cas).
   */
  appliquerTimbre: boolean;
  /** Mode de calcul de la TVA (par produit ou sur le total). */
  modeTVA: TvaMode;
  /** Taux unique (en %) appliqué au total HT quand modeTVA = GLOBALE. */
  tauxTVAGlobal?: number;
}
