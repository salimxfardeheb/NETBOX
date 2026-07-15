"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useTopbarSlot } from "@/lib/topbar-slot";
import { CloudControls } from "./components/CloudControls";
import { CVPreview } from "./components/CVPreview";
import { CVForm } from "./components/form/CVForm";
import { Select } from "./components/form/fields";
import { exportToPdf, exportToWord } from "./lib/export";
import { useCVStore } from "./lib/store";
import { templates, type TemplateKey } from "./templates";

type ExportFormat = "docx" | "pdf";

/**
 * « Créer un CV » (sidebar) pointe sur ?new=1 : on réinitialise
 * l'éditeur puis on nettoie l'URL. Isolé dans un composant sous
 * <Suspense> car useSearchParams l'exige au build.
 */
function NewCVHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      useCVStore.getState().reset();
      router.replace("/tools/cv-builder");
    }
  }, [searchParams, router]);

  return null;
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  // L'état vient du localStorage (persist) : on attend le montage client
  // pour éviter un mismatch d'hydratation avec le rendu serveur.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Export à la taille choisie par l'utilisateur : pas de réduction
  // automatique. Si le contenu déborde, le .docx fait plusieurs pages
  // (le débordement est visible dans l'aperçu).
  const handleExport = async (format: ExportFormat) => {
    setMenuOpen(false);
    setExporting(true);
    try {
      const currentData = useCVStore.getState().data;
      if (format === "pdf") {
        await exportToPdf(currentData);
      } else {
        await exportToWord(currentData, templateKey);
      }
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

      {/* Connexion + sauvegarde en ligne (Supabase). */}
      <CloudControls />

      <div className="relative" ref={menuRef}>
        <Button
          variant="accent"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={exporting}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Génération…</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="glass absolute right-0 top-[calc(100%+0.5rem)] z-30 w-48 overflow-hidden rounded-xl p-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleExport("pdf")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-primary",
                "hover:bg-surface-hover"
              )}
            >
              <FileText className="h-4 w-4" />
              Format PDF (.pdf)
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleExport("docx")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-primary",
                "hover:bg-surface-hover"
              )}
            >
              <FileText className="h-4 w-4" />
              Format Word (.docx)
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <Suspense fallback={null}>
        <NewCVHandler />
      </Suspense>
      {topbarSlot && createPortal(actions, topbarSlot)}

      {/* Split-screen : formulaire | preview */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full lg:w-[48%]">
          <CVForm />
        </div>
        <div className="w-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-[52%] lg:overflow-y-auto">

          <CVPreview data={data} onLayoutChange={setLayout} />
        </div>
      </div>
    </>
  );
}
