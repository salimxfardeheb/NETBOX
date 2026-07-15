/**
 * Conversion d'un montant en toutes lettres (français) — module pur,
 * testé unitairement. Utilisé pour la mention obligatoire « arrêtée la
 * présente facture à la somme de … » sur les documents rendus.
 */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
];

const TENS: Record<number, string> = {
  10: "dix",
  20: "vingt",
  30: "trente",
  40: "quarante",
  50: "cinquante",
  60: "soixante",
  80: "quatre-vingt",
};

/** Nombre de 0 à 99 en lettres. */
function under100(n: number): string {
  if (n < 17) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;

  // 70–79 et 90–99 se construisent sur soixante/quatre-vingt + 10..19.
  const base = n < 70 ? Math.floor(n / 10) * 10 : n < 80 ? 60 : 80;
  const rest = n - base;
  const tens = TENS[base];

  if (rest === 0) return base === 80 ? "quatre-vingts" : tens;
  // « et » pour 21, 31, 41, 51, 61 et 71 — jamais après quatre-vingt.
  if ((rest === 1 || rest === 11) && base !== 80) return `${tens} et ${under100(rest)}`;
  return `${tens}-${under100(rest)}`;
}

/**
 * Nombre de 0 à 999 en lettres.
 * `accord=false` supprime le « s » final de « cents » / « quatre-vingts » :
 * requis quand le groupe est suivi de « mille » (adjectif numéral),
 * ex. « deux cent mille », « quatre-vingt mille ».
 */
function under1000(n: number, accord = true): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) {
    const words = under100(n);
    return !accord && n === 80 ? "quatre-vingt" : words;
  }

  const prefix = hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent`;
  // « cents » uniquement quand multiplié et en fin de nombre (deux cents,
  // mais deux cent cinq).
  if (rest === 0) return hundreds > 1 && accord ? `${prefix}s` : prefix;
  return `${prefix} ${under100(rest)}`;
}

/**
 * Entier positif (ou nul) en toutes lettres françaises.
 * Gère jusqu'aux milliards, largement suffisant pour des montants DZD.
 */
export function nombreEnLettres(n: number): string {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`nombreEnLettres attend un entier positif, reçu : ${n}`);
  }
  if (n === 0) return "zéro";

  const milliards = Math.floor(n / 1_000_000_000);
  const millions = Math.floor(n / 1_000_000) % 1000;
  const milliers = Math.floor(n / 1000) % 1000;
  const reste = n % 1000;

  const parts: string[] = [];
  if (milliards > 0) {
    parts.push(`${under1000(milliards)} milliard${milliards > 1 ? "s" : ""}`);
  }
  if (millions > 0) {
    parts.push(`${under1000(millions)} million${millions > 1 ? "s" : ""}`);
  }
  if (milliers > 0) {
    // « mille » est invariable et ne prend pas « un » (mille, deux mille…).
    // Devant « mille », cents/quatre-vingts perdent leur « s ».
    parts.push(
      milliers === 1 ? "mille" : `${under1000(milliers, false)} mille`
    );
  }
  if (reste > 0) parts.push(under1000(reste));

  return parts.join(" ");
}

/** Noms d'unité monétaire pour l'écriture en lettres. */
export interface CurrencyWords {
  singulier: string;
  pluriel: string;
  sousUniteSinguliere: string;
  sousUnitePlurielle: string;
}

/** Devises connues du convertisseur — DZD par défaut. */
export const CURRENCY_WORDS: Record<string, CurrencyWords> = {
  DZD: {
    singulier: "dinar algérien",
    pluriel: "dinars algériens",
    sousUniteSinguliere: "centime",
    sousUnitePlurielle: "centimes",
  },
  EUR: {
    singulier: "euro",
    pluriel: "euros",
    sousUniteSinguliere: "centime",
    sousUnitePlurielle: "centimes",
  },
};

/**
 * Montant monétaire en toutes lettres :
 *   1 542,50 DZD → « mille cinq cent quarante-deux dinars algériens
 *   et cinquante centimes ».
 * Le montant est arrondi au centime ; les centimes sont omis s'ils sont nuls.
 */
export function montantEnLettres(montant: number, devise = "DZD"): string {
  const words = CURRENCY_WORDS[devise] ?? CURRENCY_WORDS.DZD;
  const totalCentimes = Math.round(Math.abs(montant) * 100);
  const entier = Math.floor(totalCentimes / 100);
  const centimes = totalCentimes % 100;

  const partEntiere = `${nombreEnLettres(entier)} ${
    entier > 1 ? words.pluriel : words.singulier
  }`;
  if (centimes === 0) return partEntiere;

  const partCentimes = `${nombreEnLettres(centimes)} ${
    centimes > 1 ? words.sousUnitePlurielle : words.sousUniteSinguliere
  }`;
  return `${partEntiere} et ${partCentimes}`;
}
