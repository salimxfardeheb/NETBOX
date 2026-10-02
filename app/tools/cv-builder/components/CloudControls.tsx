"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cloud, CloudUpload, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCVStore } from "../lib/store";
import { saveCV } from "../lib/cloud";

/**
 * Enregistrer le CV en ligne (routes /api/cvs → Prisma/Neon).
 * La connexion est globale (bouton « Connexion » de la Topbar,
 * via AuthProvider) — ce composant ne gère que la sauvegarde.
 */

type Status = { kind: "ok" | "error"; text: string } | null;

export function CloudControls() {
  const cvId = useCVStore((s) => s.cvId);
  const cvTitle = useCVStore((s) => s.cvTitle);
  const setCvMeta = useCVStore((s) => s.setCvMeta);

  const { configured, pseudo } = useAuth();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Base non configurée (DATABASE_URL) : le module reste hors-ligne.
  if (configured === false) return null;

  const handleSave = async () => {
    if (!pseudo) return;
    setBusy(true);
    setStatus(null);
    try {
      const state = useCVStore.getState();
      // Titre par défaut : "CV Prénom Nom" si dispo, sinon "Mon CV".
      const fallback =
        `CV ${state.data.basics.firstName} ${state.data.basics.lastName}`.trim();
      const title = cvTitle.trim() || (fallback !== "CV" ? fallback : "Mon CV");

      const id = await saveCV(state.data, title, cvId);
      setCvMeta(id, title);
      setStatus({
        kind: "ok",
        text: cvId ? "CV mis à jour." : "CV enregistré en ligne.",
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: `Échec de l'enregistrement : ${(err as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const fieldClasses =
    "w-full rounded-lg border border-glass-border bg-field px-3 py-2 text-sm text-content-primary " +
    "placeholder:text-content-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Sauvegarde en ligne"
      >
        <Cloud className="h-4 w-4" />
        <span className="hidden md:inline">Sauvegarde</span>
      </Button>

      {open && (
        <div className="glass-solid absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 rounded-xl p-3 shadow-lg">
          {pseudo ? (
            <div className="space-y-2">
              <input
                className={fieldClasses}
                value={cvTitle}
                placeholder="Titre du CV (ex. CV Développeur)"
                onChange={(e) => setCvMeta(cvId, e.target.value)}
              />
              <Button
                variant="accent"
                size="sm"
                className="w-full"
                disabled={busy}
                onClick={handleSave}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
                {cvId ? "Mettre à jour en ligne" : "Enregistrer en ligne"}
              </Button>
              <Link
                href="/tools/cv-builder/cvs"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg",
                  "bg-btn text-sm font-medium text-content-primary shadow-sm hover:bg-btn-hover"
                )}
              >
                <List className="h-4 w-4" />
                Liste des CVs
              </Link>
            </div>
          ) : (
            <p className="text-xs text-content-secondary">
              Connectez-vous via le bouton « Connexion » en haut à droite pour
              sauvegarder votre CV en ligne.
            </p>
          )}

          {status && (
            <p
              className={cn(
                "mt-2 text-xs",
                status.kind === "ok" ? "text-content-secondary" : "text-red-400"
              )}
            >
              {status.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
