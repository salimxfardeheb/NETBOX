"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTopbarSlot } from "@/lib/topbar-slot";
import { CVPreview } from "./components/CVPreview";
import { CVForm } from "./components/form/CVForm";
import { Select } from "./components/form/fields";
import { exportToWord } from "./lib/export";
import { useCVStore } from "./lib/store";
import { templates, type TemplateKey } from "./templates";

export default function CVBuilderPage() {
  const data = useCVStore((s) => s.data);
  const templateKey = useCVStore((s) => s.templateKey);
  const setTemplate = useCVStore((s) => s.setTemplate);
  const setLayout = useCVStore((s) => s.setLayout);
  const setFontScale = useCVStore((s) => s.setFontScale);
  const reset = useCVStore((s) => s.reset);
  const fontScale = data.fontScale ?? 100;
  const topbarSlot = useTopbarSlot((s) => s.el);

  const [exporting, setExporting] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  // L'état vient du localStorage (persist) : on attend le montage client
  // pour éviter un mismatch d'hydratation avec le rendu serveur.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /** Attend deux frames pour laisser la preview se re-rendre. */
  const nextFrame = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

  /** Vrai si la preview tient dans une page A4 (hauteur = largeur × 297/210). */
  const fitsOnePage = () => {
    const sheet =
      previewWrapRef.current?.querySelector<HTMLElement>("[data-cv-sheet]");
    if (!sheet) return true;
    return sheet.scrollHeight <= (sheet.clientWidth * 297) / 210 + 2;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Ajustement automatique : réduit l'écriture pas à pas (jusqu'à
      // 70 %) pour que le CV tienne sur une seule page bien lisible.
      let currentScale = useCVStore.getState().data.fontScale ?? 100;
      while (!fitsOnePage() && currentScale > 70) {
        currentScale -= 5;
        setFontScale(currentScale);
        await nextFrame();
      }
      await exportToWord(useCVStore.getState().data, templateKey);
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Réinitialiser le CV ? Toutes les données saisies seront perdues.")) {
      reset();
    }
  };

  if (!mounted) {
    return (
      <div className="glass flex h-40 items-center justify-center rounded-glass text-sm text-content-secondary">
        Chargement de l&apos;éditeur…
      </div>
    );
  }

  // Contrôles fusionnés dans la barre du haut (Topbar) via un portail.
  const actions = (
    <>
      <label className="flex items-center gap-2 text-sm text-content-secondary">
        <span className="hidden sm:inline">Template</span>
        <Select
          value={templateKey}
          onChange={(e) => setTemplate(e.target.value as TemplateKey)}
          className="h-9 w-44 rounded-lg lg:w-56"
        >
          {Object.entries(templates).map(([key, template]) => (
            <option key={key} value={key}>
              {template.label}
            </option>
          ))}
        </Select>
      </label>

      {/* Taille de l'écriture (preview + export Word) */}
      <div className="flex items-center gap-1" title="Taille de l'écriture">
        <Button
          variant="ghost"
          size="icon"
          className="text-xs"
          aria-label="Réduire l'écriture"
          disabled={fontScale <= 70}
          onClick={() => setFontScale(fontScale - 10)}
        >
          A−
        </Button>
        <span className="w-12 text-center text-xs tabular-nums text-content-secondary">
          {fontScale} %
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-xs"
          aria-label="Agrandir l'écriture"
          disabled={fontScale >= 150}
          onClick={() => setFontScale(fontScale + 10)}
        >
          A+
        </Button>
      </div>

      <Button variant="ghost" onClick={handleReset}>
        <RotateCcw className="h-4 w-4" />
        <span className="hidden md:inline">Réinitialiser</span>
      </Button>

      <Button variant="accent" onClick={handleExport} disabled={exporting}>
        {exporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Génération…</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger .docx</span>
          </>
        )}
      </Button>
    </>
  );

  return (
    <>
      {topbarSlot && createPortal(actions, topbarSlot)}

      {/* Split-screen : formulaire | preview */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full lg:w-[48%]">
          <CVForm />
        </div>
        <div
          ref={previewWrapRef}
          className="w-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-[52%] lg:overflow-y-auto"
        >
          <CVPreview data={data} onLayoutChange={setLayout} />
        </div>
      </div>
    </>
  );
}
