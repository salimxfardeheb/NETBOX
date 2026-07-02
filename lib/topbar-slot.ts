import { create } from "zustand";

/**
 * Slot partagé de la barre du haut (Topbar). Une page peut y injecter
 * ses actions via un portail, afin de fusionner sa barre d'outils avec
 * la barre du haut globale (une seule barre au lieu de deux).
 *
 * Le Topbar publie l'élément DOM du slot ; les pages lisent `el` et y
 * rendent leurs contrôles avec `createPortal`.
 */
interface TopbarSlotState {
  el: HTMLElement | null;
  setEl: (el: HTMLElement | null) => void;
}

export const useTopbarSlot = create<TopbarSlotState>((set) => ({
  el: null,
  setEl: (el) => set({ el }),
}));
