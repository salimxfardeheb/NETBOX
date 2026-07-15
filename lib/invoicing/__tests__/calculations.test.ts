import { describe, expect, it } from "vitest";
import {
  computeItem,
  computeStampDuty,
  computeTotals,
  isStampDutyApplicable,
  round2,
} from "../calculations";
import type { InvoiceItemInput } from "../types";

/** Ligne de base : 10 × 1 000 DA HT, TVA 19 %, sans remise. */
function baseItem(overrides: Partial<InvoiceItemInput> = {}): InvoiceItemInput {
  return {
    designation: "Article test",
    quantite: 10,
    unite: "U",
    prixUnitaireHT: 1000,
    remiseType: "POURCENT",
    remiseValeur: 0,
    taux: 19,
    ...overrides,
  };
}

describe("round2", () => {
  it("arrondit au centime le plus proche", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.674999)).toBe(2.67);
    expect(round2(-1.005)).toBe(-1);
  });
});

describe("computeItem", () => {
  it("calcule HT / TVA / TTC sans remise", () => {
    const item = computeItem(baseItem());
    expect(item.montantHT).toBe(10_000);
    expect(item.montantRemise).toBe(0);
    expect(item.montantTVA).toBe(1_900);
    expect(item.montantTTC).toBe(11_900);
  });

  it("applique une remise en pourcentage", () => {
    const item = computeItem(baseItem({ remiseValeur: 10 }));
    expect(item.montantRemise).toBe(1_000);
    expect(item.montantHT).toBe(9_000);
    expect(item.montantTVA).toBe(1_710);
    expect(item.montantTTC).toBe(10_710);
  });

  it("applique une remise en montant fixe", () => {
    const item = computeItem(
      baseItem({ remiseType: "MONTANT", remiseValeur: 500 })
    );
    expect(item.montantRemise).toBe(500);
    expect(item.montantHT).toBe(9_500);
  });

  it("borne la remise entre 0 et le brut", () => {
    const trop = computeItem(
      baseItem({ remiseType: "MONTANT", remiseValeur: 99_999 })
    );
    expect(trop.montantRemise).toBe(10_000);
    expect(trop.montantHT).toBe(0);
    expect(trop.montantTTC).toBe(0);

    const negative = computeItem(
      baseItem({ remiseType: "MONTANT", remiseValeur: -50 })
    );
    expect(negative.montantRemise).toBe(0);
    expect(negative.montantHT).toBe(10_000);
  });

  it("gère un taux de TVA nul", () => {
    const item = computeItem(baseItem({ taux: 0 }));
    expect(item.montantTVA).toBe(0);
    expect(item.montantTTC).toBe(item.montantHT);
  });

  it("gère des quantités décimales", () => {
    const item = computeItem(
      baseItem({ quantite: 2.5, prixUnitaireHT: 99.99, taux: 9 })
    );
    expect(item.montantHT).toBe(249.98);
    expect(item.montantTVA).toBe(22.5);
    expect(item.montantTTC).toBe(272.48);
  });
});

describe("computeStampDuty (barème par tranches de 100 DA)", () => {
  it("retourne 0 pour un montant nul ou négatif", () => {
    expect(computeStampDuty(0)).toBe(0);
    expect(computeStampDuty(-100)).toBe(0);
  });

  it("applique le minimum de perception", () => {
    // 250 DA → 3 tranches × 1 DA = 3 DA < minimum 5 DA.
    expect(computeStampDuty(250)).toBe(5);
    expect(computeStampDuty(1)).toBe(5);
  });

  it("compte 1 DA par tranche de 100 DA jusqu'à 30 000 DA (~1 %)", () => {
    expect(computeStampDuty(10_000)).toBe(100);
    expect(computeStampDuty(30_000)).toBe(300);
    // Tranche entamée : 10 050 → 101 tranches.
    expect(computeStampDuty(10_050)).toBe(101);
  });

  it("passe à 1,5 DA par tranche entre 30 000 et 100 000 DA", () => {
    // 300 (première tranche) + 200 × 1,5 = 600.
    expect(computeStampDuty(50_000)).toBe(600);
    // 300 + 700 × 1,5 = 1 350.
    expect(computeStampDuty(100_000)).toBe(1_350);
    // Fraction entamée dans la 2e tranche : 300 + 1 × 1,5.
    expect(computeStampDuty(30_050)).toBe(301.5);
  });

  it("passe à 2 DA par tranche au-delà de 100 000 DA", () => {
    // 300 + 1 050 + 500 × 2 = 2 350.
    expect(computeStampDuty(150_000)).toBe(2_350);
  });

  it("n'est dû que pour les espèces", () => {
    expect(isStampDutyApplicable("ESPECES")).toBe(true);
    expect(isStampDutyApplicable("VIREMENT")).toBe(false);
    expect(isStampDutyApplicable("CHEQUE")).toBe(false);
    expect(isStampDutyApplicable("CARTE")).toBe(false);
  });
});

describe("computeTotals", () => {
  const items = [
    computeItem(baseItem()), // 10 000 HT, TVA 19 % → 1 900
    computeItem(
      baseItem({ prixUnitaireHT: 500, quantite: 4, taux: 9, remiseValeur: 10 })
    ), // brut 2 000, remise 200 → 1 800 HT, TVA 9 % → 162
    computeItem(baseItem({ prixUnitaireHT: 100, quantite: 1, taux: 0 })), // 100 HT, TVA 0
  ];

  it("agrège HT, remises et TVA ventilée par taux", () => {
    const totals = computeTotals(items, "VIREMENT");
    expect(totals.totalBrutHT).toBe(12_100);
    expect(totals.totalRemises).toBe(200);
    expect(totals.totalHT).toBe(11_900);
    expect(totals.tvaParTaux).toEqual([
      { taux: 0, base: 100, montant: 0 },
      { taux: 9, base: 1_800, montant: 162 },
      { taux: 19, base: 10_000, montant: 1_900 },
    ]);
    expect(totals.totalTVA).toBe(2_062);
    expect(totals.totalTTC).toBe(13_962);
  });

  it("exonère de timbre les paiements hors espèces", () => {
    const totals = computeTotals(items, "CHEQUE");
    expect(totals.droitTimbre).toBe(0);
    expect(totals.totalAPayer).toBe(totals.totalTTC);
  });

  it("ajoute le droit de timbre pour un paiement en espèces", () => {
    const totals = computeTotals(items, "ESPECES");
    // TTC 13 962 → 140 tranches × 1 DA = 140 DA.
    expect(totals.droitTimbre).toBe(140);
    expect(totals.totalAPayer).toBe(14_102);
  });

  it("permet de désactiver le timbre (facultatif) même en espèces", () => {
    const totals = computeTotals(items, "ESPECES", 0, { appliquerTimbre: false });
    expect(totals.droitTimbre).toBe(0);
    expect(totals.totalAPayer).toBe(totals.totalTTC);
  });

  it("déduit l'acompte pour obtenir le reste à payer", () => {
    const totals = computeTotals(items, "ESPECES", 5_000);
    expect(totals.acompte).toBe(5_000);
    expect(totals.resteAPayer).toBe(9_102);
  });

  it("borne le reste à payer à 0 et ignore un acompte négatif", () => {
    expect(computeTotals(items, "VIREMENT", 999_999).resteAPayer).toBe(0);
    expect(computeTotals(items, "VIREMENT", -50).acompte).toBe(0);
  });

  it("applique une TVA globale sur le total HT au lieu des lignes", () => {
    // Lignes calculées SANS TVA (taux 0) : c'est le mode « TVA sur le total ».
    const horsTVA = [
      computeItem(baseItem({ taux: 0 })), // 10 000 HT
      computeItem(baseItem({ taux: 0, prixUnitaireHT: 500, quantite: 4 })), // 2 000 HT
    ];
    const totals = computeTotals(horsTVA, "VIREMENT", 0, { tvaGlobale: 19 });
    expect(totals.totalHT).toBe(12_000);
    expect(totals.totalTVA).toBe(2_280);
    expect(totals.tvaParTaux).toEqual([
      { taux: 19, base: 12_000, montant: 2_280 },
    ]);
    expect(totals.totalTTC).toBe(14_280);
  });

  it("retourne des totaux nuls sans lignes (et sans timbre)", () => {
    const totals = computeTotals([], "ESPECES");
    expect(totals.totalTTC).toBe(0);
    expect(totals.droitTimbre).toBe(0);
    expect(totals.tvaParTaux).toEqual([]);
    expect(totals.resteAPayer).toBe(0);
  });
});
