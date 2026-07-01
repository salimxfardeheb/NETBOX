import type { CVLanguage } from "./types";

/**
 * Niveaux proposés dans le formulaire, du plus fort au plus faible.
 * Le libellé choisi est stocké tel quel dans `CVLanguage.level`.
 */
export const LEVEL_OPTIONS = [
  "Langue maternelle",
  "C2",
  "C1",
  "Courant",
  "B2",
  "B1",
  "Intermédiaire",
  "A2",
  "A1",
  "Débutant",
] as const;

const LEVEL_PERCENT: Record<string, number> = {
  "langue maternelle": 100,
  c2: 96,
  c1: 92,
  courant: 88,
  b2: 75,
  b1: 62,
  intermédiaire: 58,
  a2: 42,
  a1: 28,
  débutant: 15,
};

/**
 * Convertit une langue en pourcentage (0–100) pour la barre de niveau.
 * `value` manuel prioritaire, sinon table des libellés, sinon 50 %.
 */
export function levelToPercent(language: CVLanguage): number {
  if (typeof language.value === "number") {
    return Math.min(100, Math.max(0, language.value));
  }
  return LEVEL_PERCENT[language.level.trim().toLowerCase()] ?? 50;
}
