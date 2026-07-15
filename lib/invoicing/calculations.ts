import {
  MODES_AVEC_TIMBRE,
  STAMP_DUTY_CONFIG,
  type StampDutyConfig,
} from "./config";
import type {
  InvoiceItem,
  InvoiceItemInput,
  ModePaiement,
} from "./types";

/**
 * Calculs purs du module Factures — aucun import d'UI, aucune dépendance
 * au DOM. Testé unitairement (lib/invoicing/__tests__). L'étape 2 (SQLite,
 * export Excel) réutilisera ce module tel quel.
 */

/** Arrondi monétaire à 2 décimales (au plus proche). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcule les montants d'une ligne :
 *   brut  = quantite × prixUnitaireHT
 *   remise = brut × valeur % (POURCENT) ou valeur fixe (MONTANT), bornée à [0, brut]
 *   montantHT = brut − remise ; montantTVA = montantHT × taux/100 ;
 *   montantTTC = montantHT + montantTVA.
 */
export function computeItem(input: InvoiceItemInput): InvoiceItem {
  const brut = input.quantite * input.prixUnitaireHT;
  const remiseBrute =
    input.remiseType === "POURCENT"
      ? brut * (input.remiseValeur / 100)
      : input.remiseValeur;
  const montantRemise = round2(Math.min(Math.max(remiseBrute, 0), brut));
  const montantHT = round2(brut - montantRemise);
  const montantTVA = round2(montantHT * (input.taux / 100));
  return {
    ...input,
    montantHT,
    montantRemise,
    montantTVA,
    montantTTC: round2(montantHT + montantTVA),
  };
}

/**
 * Droit de timbre sur paiement en espèces — barème progressif par tranches.
 * Pour chaque tranche du barème, la part du montant qui y tombe est découpée
 * en tranches d'assiette de `trancheDA` (toute tranche entamée est due), et
 * chaque tranche coûte `droitParTranche`. Minimum de perception appliqué.
 * Retourne 0 pour un montant nul ou négatif.
 */
export function computeStampDuty(
  montantTTC: number,
  config: StampDutyConfig = STAMP_DUTY_CONFIG
): number {
  if (montantTTC <= 0) return 0;

  let droit = 0;
  let borneBasse = 0;
  for (const { jusquA, droitParTranche } of config.bareme) {
    const borneHaute = jusquA ?? Infinity;
    if (montantTTC <= borneBasse) break;
    const part = Math.min(montantTTC, borneHaute) - borneBasse;
    droit += Math.ceil(part / config.trancheDA) * droitParTranche;
    borneBasse = borneHaute;
  }

  return round2(Math.max(droit, config.minimumDA));
}

/** Le droit de timbre s'applique-t-il à ce mode de paiement ? */
export function isStampDutyApplicable(mode: ModePaiement): boolean {
  return MODES_AVEC_TIMBRE.includes(mode);
}

/** Ventilation de la TVA pour un taux donné. */
export interface TvaBreakdownEntry {
  /** Taux en %. */
  taux: number;
  /** Base imposable (somme des montants HT à ce taux). */
  base: number;
  /** TVA collectée à ce taux. */
  montant: number;
}

/** Totaux d'un document, timbre et acompte inclus. */
export interface InvoiceTotals {
  /** Somme des lignes avant remise. */
  totalBrutHT: number;
  totalRemises: number;
  /** Somme des montants HT après remise. */
  totalHT: number;
  /** TVA ventilée par taux (taux croissant, taux à base nulle exclus). */
  tvaParTaux: TvaBreakdownEntry[];
  totalTVA: number;
  /** HT + TVA, hors timbre. */
  totalTTC: number;
  /** Droit de timbre (0 si mode de paiement exonéré). */
  droitTimbre: number;
  /** TTC + timbre : montant final du document. */
  totalAPayer: number;
  acompte: number;
  /** totalAPayer − acompte (borné à 0). */
  resteAPayer: number;
}

/** Options de calcul des totaux. */
export interface ComputeTotalsOptions {
  /**
   * Le timbre est FACULTATIF : il n'est calculé que si `appliquerTimbre`
   * est vrai ET que le mode de paiement y est soumis (espèces).
   * `true` par défaut (comportement légal standard) — l'UI passe son toggle.
   */
  appliquerTimbre?: boolean;
  stampConfig?: StampDutyConfig;
  /**
   * TVA GLOBALE : taux unique (en %) appliqué au total HT du document.
   * Quand défini, la TVA des lignes est ignorée — la TVA est calculée en
   * une fois sur le total. Non défini = somme des TVA par ligne.
   */
  tvaGlobale?: number;
}

/**
 * Totaux du document à partir des lignes calculées.
 * Le droit de timbre n'est jamais dû hors espèces (virement, chèque et
 * carte exonérés) et peut être désactivé via `options.appliquerTimbre`.
 */
export function computeTotals(
  items: InvoiceItem[],
  modePaiement: ModePaiement,
  acompte = 0,
  options: ComputeTotalsOptions = {}
): InvoiceTotals {
  const {
    appliquerTimbre = true,
    stampConfig = STAMP_DUTY_CONFIG,
    tvaGlobale,
  } = options;
  const totalBrutHT = round2(
    items.reduce((sum, it) => sum + it.montantHT + it.montantRemise, 0)
  );
  const totalRemises = round2(
    items.reduce((sum, it) => sum + it.montantRemise, 0)
  );
  const totalHT = round2(items.reduce((sum, it) => sum + it.montantHT, 0));

  let tvaParTaux: TvaBreakdownEntry[];
  let totalTVA: number;
  if (tvaGlobale !== undefined) {
    // TVA globale : un seul taux appliqué au total HT du document.
    totalTVA = round2(totalHT * (tvaGlobale / 100));
    tvaParTaux =
      totalHT !== 0
        ? [{ taux: tvaGlobale, base: totalHT, montant: totalTVA }]
        : [];
  } else {
    const parTaux = new Map<number, { base: number; montant: number }>();
    for (const it of items) {
      const entry = parTaux.get(it.taux) ?? { base: 0, montant: 0 };
      entry.base += it.montantHT;
      entry.montant += it.montantTVA;
      parTaux.set(it.taux, entry);
    }
    tvaParTaux = [...parTaux.entries()]
      .filter(([, v]) => v.base !== 0)
      .map(([taux, v]) => ({
        taux,
        base: round2(v.base),
        montant: round2(v.montant),
      }))
      .sort((a, b) => a.taux - b.taux);
    totalTVA = round2(items.reduce((sum, it) => sum + it.montantTVA, 0));
  }
  const totalTTC = round2(totalHT + totalTVA);

  const droitTimbre =
    appliquerTimbre && isStampDutyApplicable(modePaiement)
      ? computeStampDuty(totalTTC, stampConfig)
      : 0;
  const totalAPayer = round2(totalTTC + droitTimbre);
  const acompteApplique = round2(Math.max(acompte, 0));

  return {
    totalBrutHT,
    totalRemises,
    totalHT,
    tvaParTaux,
    totalTVA,
    totalTTC,
    droitTimbre,
    totalAPayer,
    acompte: acompteApplique,
    resteAPayer: round2(Math.max(totalAPayer - acompteApplique, 0)),
  };
}
