import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  CVBasics,
  CVCustomKind,
  CVCustomSection,
  CVData,
  CVEntry,
  CVLanguage,
  CVLayout,
  CVSkillCategory,
} from "./types";
import type { TemplateKey } from "../templates";

/** Sections contenant des listes d'objets. */
export type ItemSection = "experience" | "education" | "languages" | "informatique";
/** Sections contenant des listes de chaînes. */
export type StringSection = "atouts" | "interests";

interface SectionItemMap {
  experience: CVEntry;
  education: CVEntry;
  languages: CVLanguage;
  informatique: CVSkillCategory;
}

const EMPTY_ITEM: { [S in ItemSection]: () => SectionItemMap[S] } = {
  experience: () => ({ title: "", org: "", location: "", date: "", bullets: [] }),
  education: () => ({ title: "", org: "", location: "", date: "", bullets: [] }),
  languages: () => ({ name: "", level: "B1" }),
  informatique: () => ({ label: "", items: "" }),
};

/** Disposition du modèle 4 : contact/résumé/formations/expériences à gauche. */
export function createDefaultLayout(): CVLayout {
  return {
    left: ["contact", "summary", "education", "experience"],
    right: ["languages", "atouts", "interests", "informatique"],
  };
}

/** Atouts (compétences comportementales) pré-remplis par défaut. */
export const DEFAULT_ATOUTS = [
  "Esprit d'équipe",
  "Communication",
  "Sens des responsabilités",
  "Rigueur",
  "Autonomie",
  "Adaptabilité",
];

/** Centres d'intérêt pré-remplis par défaut. */
export const DEFAULT_INTERESTS = [
  "Lecture & apprentissage",
  "Créativité",
  "Bien-être",
  "Photographie",
  "Voyages",
];

export function createEmptyCV(): CVData {
  return {
    basics: {
      firstName: "",
      lastName: "",
      title: "",
      summary: "",
      summaryJustify: false,
      photoSize: 100,
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      permis: "",
      nationality: "",
      maritalStatus: "",
      linkedin: "",
      website: "",
      github: "",
      personalCustom: [],
    },
    languages: [],
    atouts: [...DEFAULT_ATOUTS],
    interests: [...DEFAULT_INTERESTS],
    education: [],
    experience: [],
    informatique: [],
    custom: [],
    layout: createDefaultLayout(),
    fontScale: 100,
  };
}

function newCustomId(): string {
  return `custom:${
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  }`;
}

/** Échange l'élément `index` avec son voisin ; no-op aux bords. */
function move(list: unknown[], index: number, dir: "up" | "down"): void {
  const target = dir === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

/** Déplace l'élément `from` à la position `to` (drag-and-drop). */
function reorder(list: unknown[], from: number, to: number): void {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

interface CVStore {
  data: CVData;
  templateKey: TemplateKey;
  /** Id du CV en base (null = jamais enregistré en ligne). */
  cvId: string | null;
  /** Titre du CV en base. */
  cvTitle: string;

  /** Remplace tout le CV (chargement depuis la sauvegarde en ligne). */
  setData: (data: CVData) => void;
  /** Associe l'éditeur à un CV en base (ou le détache avec null). */
  setCvMeta: (id: string | null, title: string) => void;
  setBasics: (patch: Partial<CVBasics>) => void;
  setPhoto: (dataUrl: string | null) => void;
  setTemplate: (key: TemplateKey) => void;

  /** Lignes d'infos personnelles libres (basics.personalCustom). */
  addPersonalCustom: () => void;
  updatePersonalCustom: (index: number, value: string) => void;
  removePersonalCustom: (index: number) => void;
  reorderPersonalCustom: (from: number, to: number) => void;

  addItem: (section: ItemSection) => void;
  updateItem: <S extends ItemSection>(
    section: S,
    index: number,
    patch: Partial<SectionItemMap[S]>
  ) => void;
  removeItem: (section: ItemSection, index: number) => void;
  moveItem: (section: ItemSection, index: number, dir: "up" | "down") => void;
  reorderItem: (section: ItemSection, from: number, to: number) => void;

  addString: (section: StringSection) => void;
  updateString: (section: StringSection, index: number, value: string) => void;
  removeString: (section: StringSection, index: number) => void;
  moveString: (section: StringSection, index: number, dir: "up" | "down") => void;
  reorderString: (section: StringSection, from: number, to: number) => void;

  /** Repositionne les sections dans les colonnes (drag-and-drop preview). */
  setLayout: (layout: CVLayout) => void;

  /** Taille globale de l'écriture (clampée 70–150 %). */
  setFontScale: (value: number) => void;

  addCustomSection: (kind: CVCustomKind) => void;
  updateCustomSection: (id: string, patch: Partial<Omit<CVCustomSection, "id">>) => void;
  removeCustomSection: (id: string) => void;

  reset: () => void;
}

export const useCVStore = create<CVStore>()(
  persist(
    immer((set) => ({
      data: createEmptyCV(),
      templateKey: "modele4",
      cvId: null,
      cvTitle: "",

      setCvMeta: (id, title) =>
        set((state) => {
          state.cvId = id;
          state.cvTitle = title;
        }),

      setData: (data) =>
        set((state) => {
          // Mêmes garde-fous que `migrate` : un JSON sauvegardé par une
          // version antérieure du module reste chargeable.
          data.custom ??= [];
          data.layout ??= createDefaultLayout();
          data.basics.personalCustom ??= [];
          data.fontScale ??= 100;
          for (const section of data.custom) {
            section.kind ??= "list";
            section.items ??= [];
            section.entries ??= [];
            section.text ??= "";
          }
          state.data = data;
        }),

      setBasics: (patch) =>
        set((state) => {
          Object.assign(state.data.basics, patch);
        }),

      setPhoto: (dataUrl) =>
        set((state) => {
          state.data.basics.photo = dataUrl ?? undefined;
        }),

      addPersonalCustom: () =>
        set((state) => {
          (state.data.basics.personalCustom ??= []).push("");
        }),

      updatePersonalCustom: (index, value) =>
        set((state) => {
          const list = state.data.basics.personalCustom;
          if (list && index >= 0 && index < list.length) list[index] = value;
        }),

      removePersonalCustom: (index) =>
        set((state) => {
          state.data.basics.personalCustom?.splice(index, 1);
        }),

      reorderPersonalCustom: (from, to) =>
        set((state) => {
          if (state.data.basics.personalCustom) {
            reorder(state.data.basics.personalCustom, from, to);
          }
        }),

      setTemplate: (key) =>
        set((state) => {
          state.templateKey = key;
        }),

      addItem: (section) =>
        set((state) => {
          (state.data[section] as unknown[]).push(EMPTY_ITEM[section]());
        }),

      updateItem: (section, index, patch) =>
        set((state) => {
          const item = state.data[section][index];
          if (item) Object.assign(item, patch);
        }),

      removeItem: (section, index) =>
        set((state) => {
          state.data[section].splice(index, 1);
        }),

      moveItem: (section, index, dir) =>
        set((state) => {
          move(state.data[section], index, dir);
        }),

      reorderItem: (section, from, to) =>
        set((state) => {
          reorder(state.data[section], from, to);
        }),

      addString: (section) =>
        set((state) => {
          state.data[section].push("");
        }),

      updateString: (section, index, value) =>
        set((state) => {
          if (index >= 0 && index < state.data[section].length) {
            state.data[section][index] = value;
          }
        }),

      removeString: (section, index) =>
        set((state) => {
          state.data[section].splice(index, 1);
        }),

      moveString: (section, index, dir) =>
        set((state) => {
          move(state.data[section], index, dir);
        }),

      reorderString: (section, from, to) =>
        set((state) => {
          reorder(state.data[section], from, to);
        }),

      setLayout: (layout) =>
        set((state) => {
          state.data.layout = layout;
        }),

      setFontScale: (value) =>
        set((state) => {
          state.data.fontScale = Math.min(150, Math.max(70, Math.round(value)));
        }),

      addCustomSection: (kind) =>
        set((state) => {
          const section: CVCustomSection = {
            id: newCustomId(),
            title: "",
            kind,
            items: [],
            entries: [],
            text: "",
          };
          state.data.custom.push(section);
          // Un nouveau bloc apparaît en bas de la colonne de droite.
          state.data.layout.right.push(section.id);
        }),

      updateCustomSection: (id, patch) =>
        set((state) => {
          const section = state.data.custom.find((c) => c.id === id);
          if (section) Object.assign(section, patch);
        }),

      removeCustomSection: (id) =>
        set((state) => {
          state.data.custom = state.data.custom.filter((c) => c.id !== id);
          state.data.layout.left = state.data.layout.left.filter((s) => s !== id);
          state.data.layout.right = state.data.layout.right.filter((s) => s !== id);
        }),

      reset: () =>
        set((state) => {
          state.data = createEmptyCV();
          // Détache l'éditeur du CV en base : un CV réinitialisé ne doit
          // pas écraser silencieusement un CV enregistré en ligne.
          state.cvId = null;
          state.cvTitle = "";
        }),
    })),
    {
      name: "cv-builder-state",
      version: 5,
      partialize: (state) => ({
        data: state.data,
        templateKey: state.templateKey,
        cvId: state.cvId,
        cvTitle: state.cvTitle,
      }),
      // v1 n'avait ni custom, ni layout, ni summaryJustify.
      // v2 n'avait ni kind sur les blocs custom, ni fontScale/photoSize.
      // v3 n'avait ni github, ni infos personnelles libres (personalCustom).
      // v4 n'avait pas de valeurs par défaut pour Atouts / Centres d'intérêt.
      migrate: (persisted) => {
        const state = persisted as { data: CVData; templateKey: TemplateKey };
        if (state?.data) {
          state.data.custom ??= [];
          state.data.layout ??= createDefaultLayout();
          state.data.basics.summaryJustify ??= false;
          state.data.basics.photoSize ??= 100;
          state.data.basics.github ??= "";
          state.data.basics.personalCustom ??= [];
          state.data.fontScale ??= 100;
          // Pré-remplissage des blocs vides (ne remplace jamais des données saisies).
          if (!state.data.atouts?.some((v) => v.trim())) {
            state.data.atouts = [...DEFAULT_ATOUTS];
          }
          if (!state.data.interests?.some((v) => v.trim())) {
            state.data.interests = [...DEFAULT_INTERESTS];
          }
          for (const section of state.data.custom) {
            section.kind ??= "list";
            section.items ??= [];
            section.entries ??= [];
            section.text ??= "";
          }
        }
        return state;
      },
    }
  )
);
