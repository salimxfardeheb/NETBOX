import type { Document } from "docx";
import type { CVData } from "../lib/types";
import { buildClassique, type ClassiqueVariant } from "./classique";
import { buildModele4 } from "./modele4";

export interface CVTemplate {
  /** Libellé affiché dans le sélecteur de template. */
  label: string;
  /** Construit le document Word complet à partir des données (async :
   *  la rastérisation des icônes utilise le DOM). */
  build: (data: CVData) => Document | Promise<Document>;
  /** Version du modèle classique (absent = mise en page du modèle 4). */
  classique?: ClassiqueVariant;
}

/**
 * Registre des templates .docx. Ajouter un modèle = un fichier
 * `modeleX.ts` + une entrée ici ; le sélecteur de la page se met
 * à jour automatiquement via `Object.entries(templates)`.
 */
export const templates = {
  modele4: { label: "Modèle 4 — Classique", build: buildModele4 },
  classiqueHomme: {
    label: "Modèle encadré — Homme",
    build: (data: CVData) => buildClassique(data, "homme"),
    classique: "homme",
  },
  classiqueFemme: {
    label: "Modèle encadré — Femme",
    build: (data: CVData) => buildClassique(data, "femme"),
    classique: "femme",
  },
} as const satisfies Record<string, CVTemplate>;

export type TemplateKey = keyof typeof templates;

/** Version du modèle classique d'un template, ou null (modèle 4). */
export function classiqueVariantOf(key: TemplateKey): ClassiqueVariant | null {
  const template: CVTemplate = templates[key];
  return template.classique ?? null;
}
