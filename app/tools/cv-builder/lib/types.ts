/**
 * Modèle de données du CV — source de vérité du module.
 * Toute la chaîne (formulaire → store → preview → export .docx)
 * consomme cette structure.
 */

export interface CVBasics {
  firstName: string;
  lastName: string;
  title: string;
  summary?: string;
  /** Justifie le texte du résumé (preview + export Word). */
  summaryJustify?: boolean;
  /**
   * Photo encodée en data URL (base64) — recompressée à
   * l'enregistrement, puis stockée telle quelle dans le JSON du CV.
   */
  photo?: string;
  /** Taille de la photo en % (100 = taille du modèle). */
  photoSize?: number;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  permis?: string;
  nationality?: string;
  /** Situation familiale (ex. "Célibataire"). */
  maritalStatus?: string;
  linkedin?: string;
  website?: string;
  github?: string;
  /** Lignes d'infos personnelles libres ajoutées par l'utilisateur. */
  personalCustom?: string[];
}

export interface CVLanguage {
  name: string;
  /** Libellé du niveau (ex. "C1", "Courant", "Langue maternelle"). */
  level: string;
  /** Pourcentage manuel (0–100) qui prime sur le niveau si défini. */
  value?: number;
}

/** Bloc daté commun aux expériences et aux formations. */
export interface CVEntry {
  title: string;
  org: string;
  location?: string;
  date?: string;
  bullets?: string[];
}

/** Catégorie de compétences informatiques (ex. "OS" → "Windows, Linux"). */
export interface CVSkillCategory {
  label: string;
  items: string;
}

/** Forme d'un bloc personnalisé. */
export type CVCustomKind = "list" | "entries" | "text";

/** Bloc libre ajouté par l'utilisateur : un titre + un contenu typé. */
export interface CVCustomSection {
  id: string;
  title: string;
  /** "list" = lignes à puces, "entries" = comme une expérience, "text" = paragraphe. */
  kind: CVCustomKind;
  /** Contenu pour kind "list". */
  items?: string[];
  /** Contenu pour kind "entries". */
  entries?: CVEntry[];
  /** Contenu pour kind "text". */
  text?: string;
}

/** Sections intégrées, positionnables dans les colonnes du CV. */
export type CVBuiltinSectionId =
  | "contact"
  | "summary"
  | "education"
  | "experience"
  | "languages"
  | "atouts"
  | "interests"
  | "informatique";

/** Id de section dans le layout : intégrée ou `custom:<id>`. */
export type CVSectionId = CVBuiltinSectionId | string;

export type CVColumn = "left" | "right";

/** Ordre des sections dans les deux colonnes du corps du CV. */
export interface CVLayout {
  left: CVSectionId[];
  right: CVSectionId[];
}

export interface CVData {
  basics: CVBasics;
  languages: CVLanguage[];
  atouts: string[];
  interests: string[];
  education: CVEntry[];
  experience: CVEntry[];
  informatique: CVSkillCategory[];
  custom: CVCustomSection[];
  layout: CVLayout;
  /** Taille globale de l'écriture en % (100 = taille du modèle). */
  fontScale?: number;
}
