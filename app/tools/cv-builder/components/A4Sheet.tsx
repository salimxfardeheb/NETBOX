"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
 * Feuille A4 exprimée en points (1 px = 1 pt) — même base que l'export
 * .docx. Rendre l'aperçu à cette taille fixe (puis le mettre à l'échelle
 * pour la colonne) garantit que la taille du texte à l'écran correspond
 * exactement au document Word, quelle que soit la largeur de l'écran.
 */
export const A4_W = 595; // 210 mm — largeur A4 (base des polices : 1 px = 1 pt)
export const A4_H = 842; // 297 mm — hauteur A4 (forme de la feuille vide)

/**
 * Feuille A4 de l'aperçu, commune à tous les modèles : mise à l'échelle
 * sur la largeur disponible et repères de coupe de page.
 *
 * `fontPx` fixe la base des tailles en `em` du contenu (10 px × fontScale).
 * `pageBreakH` est la hauteur de contenu par page pour le repère de coupe.
 */
export function A4Sheet({
  fontPx,
  pageBreakH = A4_H,
  style,
  children,
}: {
  fontPx: number;
  pageBreakH?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  // Mesure de la largeur dispo (colonne) et de la hauteur réelle du contenu,
  // pour mettre la feuille A4 à l'échelle et détecter le débordement de page.
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(A4_W);
  const [sheetH, setSheetH] = useState(A4_H);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setWrapW(entries[0].contentRect.width),
    );
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSheetH(el.scrollHeight));
    ro.observe(el);
    setSheetH(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  // Échelle : on remplit la colonne sans jamais dépasser la taille réelle
  // (k ≤ 1) — ainsi le glisser-déposer reste précis sur écrans standards.
  const k = Math.min(1, wrapW / A4_W);
  const pageCount = Math.max(1, Math.ceil(sheetH / pageBreakH));

  return (
    <div ref={wrapRef} className="flex w-full justify-center">
      {/* Boîte à l'échelle : réserve l'espace réel du rendu mis à l'échelle. */}
      <div className="relative" style={{ width: A4_W * k, height: sheetH * k }}>
        <div
          ref={sheetRef}
          data-cv-sheet
          className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-xl bg-white shadow-2xl"
          style={{
            ...style,
            width: A4_W,
            minHeight: A4_H,
            fontSize: `${fontPx}px`,
            transform: `scale(${k})`,
          }}
        >
          {/* Séparateurs de page — apparaissent dès que le contenu déborde
              sur une page suivante (aperçu uniquement). */}
          {pageCount > 1 &&
            Array.from({ length: pageCount - 1 }, (_, i) => (
              <div
                key={i}
                aria-hidden
                className="pointer-events-none absolute left-0 z-20 w-full"
                style={{ top: (i + 1) * pageBreakH }}
              >
                <div className="w-full border-t-2 border-dashed border-red-400/60" />
                <span className="absolute right-2 top-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 shadow-sm">
                  Page {i + 2}
                </span>
              </div>
            ))}
          {children}
        </div>
      </div>
    </div>
  );
}
