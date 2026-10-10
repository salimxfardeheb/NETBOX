import type { CVLanguage } from "./types";

export type CVLanguageMode = "fr" | "en";

const LEVEL_OPTIONS_FR = [
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

const LEVEL_OPTIONS_EN = [
  "Native speaker",
  "C2",
  "C1",
  "Fluent",
  "B2",
  "B1",
  "Intermediate",
  "A2",
  "A1",
  "Beginner",
] as const;

/**
 * Niveaux proposés dans le formulaire, du plus fort au plus faible.
 * Le libellé choisi est stocké tel quel dans `CVLanguage.level`.
 */
export const LEVEL_OPTIONS = LEVEL_OPTIONS_FR;

export const LEVEL_OPTIONS_BY_LANGUAGE: Record<
  CVLanguageMode,
  readonly string[]
> = {
  fr: LEVEL_OPTIONS_FR,
  en: LEVEL_OPTIONS_EN,
};

export function getLevelOptions(
  language: CVLanguageMode = "fr",
): readonly string[] {
  return LEVEL_OPTIONS_BY_LANGUAGE[language];
}

function normalizeLevelText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const LEVEL_PERCENT: Record<string, number> = {
  "langue maternelle": 100,
  "native speaker": 100,
  c2: 96,
  c1: 92,
  courant: 88,
  fluent: 88,
  b2: 75,
  b1: 62,
  intermediaire: 58,
  intermediate: 58,
  a2: 42,
  a1: 28,
  debutant: 15,
  beginner: 15,
};

/**
 * Convertit une langue en pourcentage (0–100) pour la barre de niveau.
 * `value` manuel prioritaire, sinon table des libellés, sinon 50 %.
 */
export function levelToPercent(language: CVLanguage): number {
  if (typeof language.value === "number") {
    return Math.min(100, Math.max(0, language.value));
  }
  const normalized = normalizeLevelText(language.level);
  return LEVEL_PERCENT[normalized] ?? 50;
}
