"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cloud, CloudUpload, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { DOCUMENT_TYPE_LABELS } from "@/lib/invoicing/config";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveFacture } from "../lib/cloud";
import { snapshotFromState, useFactureStore } from "../lib/store";

/**
 * Enregistrer le document en ligne (routes /api/factures → Prisma/Neon,
 * JSON uniquement).
 * La connexion est globale (bouton « Connexion » de la Topbar,
 * via AuthProvider) — ce composant ne gère que la sauvegarde.
 */

type Status = { kind: "ok" | "error"; text: string } | null;

export function CloudControls() {
  const docId = useFactureStore((s) => s.docId);
  const docTitle = useFactureStore((s) => s.docTitle);
  const setDocMeta = useFactureStore((s) => s.setDocMeta);

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
      const state = useFactureStore.getState();
      // Titre par défaut : « Facture 2026-0001 — Client » selon la saisie.
      const fallback = [
        `${DOCUMENT_TYPE_LABELS[state.type]} ${state.numeroApercu}`.trim(),
        state.customer.raisonSociale.trim(),
      ]
        .filter(Boolean)
        .join(" — ");
      const title = docTitle.trim() || fallback;

      const id = await saveFacture(snapshotFromState(state), title, docId);
      setDocMeta(id, title);
      setStatus({
        kind: "ok",
        text: docId ? "Document mis à jour." : "Document enregistré en ligne.",
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
                value={docTitle}
                placeholder="Titre (ex. Facture 2026-0001)"
                onChange={(e) => setDocMeta(docId, e.target.value)}
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
                {docId ? "Mettre à jour en ligne" : "Enregistrer en ligne"}
              </Button>
              <Link
                href="/tools/factures/liste"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg",
                  "bg-btn text-sm font-medium text-content-primary shadow-sm hover:bg-btn-hover"
                )}
              >
                <List className="h-4 w-4" />
                Liste des documents
              </Link>
            </div>
          ) : (
            <p className="text-xs text-content-secondary">
              Connectez-vous via le bouton « Connexion » en haut à droite pour
              sauvegarder vos documents en ligne.
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
