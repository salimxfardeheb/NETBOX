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
  /** Bon de livraison : les prix sont optionnels sur le document rendu. */
  afficherPrixBL: boolean;

  setType: (type: DocumentType) => void;
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
    afficherPrixBL: true,
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
  reset: () => set((s) => ({ ...initialState(), company: s.company })),
}));

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
    items: s.items.map(computeItem),
    notes: s.notes || undefined,
    acompte: s.acompte,
  };
}

/** Totaux LIVE dérivés de l'état courant. */
export function buildTotals(s: FactureState) {
  return computeTotals(s.items.map(computeItem), s.modePaiement, s.acompte);
}
