import type { Document } from "docx";
import type { CVData } from "../lib/types";
import { buildModele4 } from "./modele4";

export interface CVTemplate {
  /** Libellé affiché dans le sélecteur de template. */
  label: string;
  /** Construit le document Word complet à partir des données. */
  build: (data: CVData) => Document;
}

/**
 * Registre des templates .docx. Ajouter un modèle = un fichier
 * `modeleX.ts` + une entrée ici ; le sélecteur de la page se met
 * à jour automatiquement via `Object.entries(templates)`.
 */
export const templates = {
  modele4: { label: "Modèle 4 — Classique", build: buildModele4 },
} as const satisfies Record<string, CVTemplate>;

export type TemplateKey = keyof typeof templates;
