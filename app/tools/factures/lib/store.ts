"use client";

import { create } from "zustand";
import { computeItem, computeTotals } from "@/lib/invoicing/calculations";
import {
  DEFAULT_COMPANY,
  DEFAULT_DEVISE,
  TVA_RATES,
} from "@/lib/invoicing/config";
import type {
  Company,
  Customer,
  DocumentType,
  Invoice,
  InvoiceItemInput,
  ModePaiement,
  StatutPaiement,
  TvaMode,
} from "@/lib/invoicing/types";

/**
 * Store en mémoire du module Factures — ÉTAPE 1 : aucune persistance
 * (pas de `persist`), tout est perdu au rechargement, c'est voulu.
 * L'étape 2 branchera SQLite sur `buildInvoice()` sans toucher à l'UI.
 */

/** Date du jour au format ISO (AAAA-MM-JJ), pour les champs date. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Numéro d'aperçu PROVISOIRE (non fiscal) proposé par défaut.
 * Facture : AAAA-NNNN ; les autres types sont préfixés pour lever toute
 * ambiguïté. L'attribution définitive/séquentielle est l'étape 2.
 */
export function numeroApercuParDefaut(type: DocumentType): string {
  const annee = new Date().getFullYear();
  const prefixe = { FACTURE: "", PROFORMA: "PRO-", DEVIS: "DEV-", BON_LIVRAISON: "BL-" }[type];
  return `${prefixe}${annee}-0001`;
}

/** Nouvelle ligne vierge (TVA au premier taux configuré). */
export function nouvelleLigne(): InvoiceItemInput {
  return {
    designation: "",
    reference: "",
    quantite: 1,
    unite: "U",
    prixUnitaireHT: 0,
    remiseType: "POURCENT",
    remiseValeur: 0,
    taux: TVA_RATES[0].taux,
  };
}

/** Colonnes optionnelles du tableau de lignes (éditeur + document rendu). */
export interface ColonnesVisibles {
  reference: boolean;
  unite: boolean;
  remise: boolean;
}

/**
 * Snapshot JSON sérialisable de l'éditeur — c'est exactement ce qui est
 * enregistré en base (colonne JSON, aucun fichier).
 * Données du document + préférences d'affichage, pour retrouver le
 * document tel qu'on l'a laissé.
 */
export interface FactureSnapshot {
  type: DocumentType;
  numeroApercu: string;
  company: Company;
  customer: Customer;
  dateEmission: string;
  dateEcheance: string;
  dateValidite: string;
  modePaiement: ModePaiement;
  statut: StatutPaiement;
  devise: string;
  items: InvoiceItemInput[];
  notes: string;
  acompte: number;
  appliquerTimbre: boolean;
  modeTVA: TvaMode;
  tauxTVAGlobal: number;
  afficherColonnes: ColonnesVisibles;
  afficherPrixBL: boolean;
}

interface FactureState {
  type: DocumentType;
  numeroApercu: string;
  company: Company;
  customer: Customer;
  dateEmission: string;
  dateEcheance: string;
  dateValidite: string;
  modePaiement: ModePaiement;
  statut: StatutPaiement;
  devise: string;
  items: InvoiceItemInput[];
  notes: string;
  acompte: number;
  /** Droit de timbre facultatif (n'a d'effet qu'en espèces). */
  appliquerTimbre: boolean;
  /** TVA par produit (taux par ligne) ou globale (taux unique sur le total). */
  modeTVA: TvaMode;
  /** Taux unique (en %) quand modeTVA = GLOBALE — saisie libre. */
  tauxTVAGlobal: number;
  /**
   * Champs de ligne activés : seuls les champs cochés sont saisis dans
   * l'éditeur ET affichés sur le document (pas de colonnes vides).
   */
  afficherColonnes: ColonnesVisibles;
  /** Bon de livraison : les prix sont optionnels sur le document rendu. */
  afficherPrixBL: boolean;

  /** Ligne en base du document ouvert (null = jamais enregistré). */
  docId: string | null;
  /** Titre sous lequel le document est enregistré en ligne. */
  docTitle: string;

  setType: (type: DocumentType) => void;
  setDocMeta: (docId: string | null, docTitle: string) => void;
  /** Recharge un snapshot enregistré (fusionné avec les défauts). */
  applySnapshot: (snap: Partial<FactureSnapshot>, docId: string, docTitle: string) => void;
  patch: (
    partial: Partial<
      Pick<
        FactureState,
        | "numeroApercu"
        | "dateEmission"
        | "dateEcheance"
        | "dateValidite"
        | "modePaiement"
        | "statut"
        | "devise"
        | "notes"
        | "acompte"
        | "appliquerTimbre"
        | "modeTVA"
        | "tauxTVAGlobal"
        | "afficherColonnes"
        | "afficherPrixBL"
      >
    >
  ) => void;
  patchCompany: (partial: Partial<Company>) => void;
  patchCustomer: (partial: Partial<Customer>) => void;
  addItem: () => void;
  updateItem: (index: number, partial: Partial<InvoiceItemInput>) => void;
  removeItem: (index: number) => void;
  reset: () => void;
}

function initialState() {
  return {
    type: "FACTURE" as DocumentType,
    numeroApercu: numeroApercuParDefaut("FACTURE"),
    company: { ...DEFAULT_COMPANY },
    customer: { raisonSociale: "", adresse: "", nif: "", telephone: "", email: "" },
    dateEmission: todayISO(),
    dateEcheance: "",
    dateValidite: "",
    modePaiement: "VIREMENT" as ModePaiement,
    statut: "NON_PAYEE" as StatutPaiement,
    devise: DEFAULT_DEVISE,
    items: [nouvelleLigne()],
    notes: "",
    acompte: 0,
    appliquerTimbre: false,
    modeTVA: "GLOBALE" as TvaMode,
    tauxTVAGlobal: TVA_RATES[0].taux,
    // Par défaut, seuls les champs essentiels : on coche ce qu'on veut écrire.
    afficherColonnes: { reference: false, unite: true, remise: false },
    afficherPrixBL: true,
    docId: null as string | null,
    docTitle: "",
  };
}

export const useFactureStore = create<FactureState>((set) => ({
  ...initialState(),

  setType: (type) =>
    set((s) => ({
      type,
      // On ne remplace le numéro que si l'utilisateur n'y a pas touché
      // (il vaut encore le numéro par défaut de l'ancien type).
      numeroApercu:
        s.numeroApercu === numeroApercuParDefaut(s.type)
          ? numeroApercuParDefaut(type)
          : s.numeroApercu,
    })),

  patch: (partial) => set(partial),

  setDocMeta: (docId, docTitle) => set({ docId, docTitle }),

  // Fusion avec les défauts : un snapshot d'une version antérieure du
  // module (champs manquants) se recharge sans casser.
  applySnapshot: (snap, docId, docTitle) =>
    set({ ...initialState(), ...snap, docId, docTitle }),

  patchCompany: (partial) =>
    set((s) => ({ company: { ...s.company, ...partial } })),

  patchCustomer: (partial) =>
    set((s) => ({ customer: { ...s.customer, ...partial } })),

  addItem: () => set((s) => ({ items: [...s.items, nouvelleLigne()] })),

  updateItem: (index, partial) =>
    set((s) => ({
      items: s.items.map((it, i) => (i === index ? { ...it, ...partial } : it)),
    })),

  removeItem: (index) =>
    set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

  // Le vendeur est conservé au reset : on repart d'un document vierge
  // sans avoir à retaper toutes les mentions fiscales de l'entreprise.
  // docId/docTitle sont remis à zéro : le nouveau document est détaché
  // de la ligne enregistrée.
  reset: () => set((s) => ({ ...initialState(), company: s.company })),
}));

/** Extrait le snapshot JSON à enregistrer depuis l'état courant. */
export function snapshotFromState(s: FactureState): FactureSnapshot {
  return {
    type: s.type,
    numeroApercu: s.numeroApercu,
    company: s.company,
    customer: s.customer,
    dateEmission: s.dateEmission,
    dateEcheance: s.dateEcheance,
    dateValidite: s.dateValidite,
    modePaiement: s.modePaiement,
    statut: s.statut,
    devise: s.devise,
    items: s.items,
    notes: s.notes,
    acompte: s.acompte,
    appliquerTimbre: s.appliquerTimbre,
    modeTVA: s.modeTVA,
    tauxTVAGlobal: s.tauxTVAGlobal,
    afficherColonnes: s.afficherColonnes,
    afficherPrixBL: s.afficherPrixBL,
  };
}

/**
 * Lignes calculées selon le mode de TVA : en mode GLOBALE, la TVA n'est
 * pas calculée par ligne (taux forcé à 0) — elle est appliquée une seule
 * fois sur le total HT du document.
 */
function computedItems(s: FactureState) {
  return s.modeTVA === "GLOBALE"
    ? s.items.map((it) => computeItem({ ...it, taux: 0 }))
    : s.items.map(computeItem);
}

/**
 * Assemble l'objet `Invoice` complet (lignes calculées incluses) à partir
 * de l'état courant — c'est ce que l'étape 2 enregistrera en SQLite.
 */
export function buildInvoice(s: FactureState): Invoice {
  return {
    type: s.type,
    numeroApercu: s.numeroApercu,
    company: s.company,
    customer: s.customer,
    dateEmission: s.dateEmission,
    dateEcheance: s.dateEcheance || undefined,
    dateValidite: s.dateValidite || undefined,
    modePaiement: s.modePaiement,
    statut: s.statut,
    devise: s.devise,
    items: computedItems(s),
    notes: s.notes || undefined,
    acompte: s.acompte,
    appliquerTimbre: s.appliquerTimbre,
    modeTVA: s.modeTVA,
    tauxTVAGlobal: s.modeTVA === "GLOBALE" ? s.tauxTVAGlobal : undefined,
  };
}

/** Totaux LIVE dérivés de l'état courant. */
export function buildTotals(s: FactureState) {
  return computeTotals(computedItems(s), s.modePaiement, s.acompte, {
    appliquerTimbre: s.appliquerTimbre,
    tvaGlobale: s.modeTVA === "GLOBALE" ? s.tauxTVAGlobal : undefined,
  });
}
