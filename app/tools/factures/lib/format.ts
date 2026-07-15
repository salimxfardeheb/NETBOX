/**
 * Helpers d'affichage du module Factures (formatage uniquement —
 * les calculs vivent dans lib/invoicing).
 */

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12345.6 → « 12 345,60 DA » (ou code devise si ≠ DZD). */
export function formatMoney(montant: number, devise = "DZD"): string {
  const suffix = devise === "DZD" ? "DA" : devise;
  return `${moneyFormatter.format(montant)} ${suffix}`;
}

/** « 2026-07-15 » (ISO) → « 15/07/2026 ». Chaîne vide si absente. */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}
