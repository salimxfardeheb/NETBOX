"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2, ReceiptText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  deleteFacture,
  listFactures,
  loadFacture,
  type FactureListRow,
} from "../lib/cloud";
import { useFactureStore } from "../lib/store";

/**
 * Liste des documents enregistrés (base partagée, JSON en jsonb) :
 * tout compte connecté voit l'ensemble des documents et peut les
 * ouvrir dans l'éditeur ou les supprimer.
 */
export default function FacturesListPage() {
  const router = useRouter();
  const applySnapshot = useFactureStore((s) => s.applySnapshot);
  const setDocMeta = useFactureStore((s) => s.setDocMeta);

  // Session globale (AuthProvider) : undefined = chargement.
  const { supabase, session } = useAuth();
  const [rows, setRows] = useState<FactureListRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      setRows(await listFactures(supabase));
    } catch (err) {
      setError(`Chargement de la liste : ${(err as Error).message}`);
    }
  }, [supabase]);

  useEffect(() => {
    if (session) void refresh();
  }, [session, refresh]);

  const handleOpen = async (row: FactureListRow) => {
    if (!supabase) return;
    if (
      !window.confirm(
        `Ouvrir « ${row.title} » ? Le document actuellement dans l'éditeur sera remplacé.`
      )
    ) {
      return;
    }
    setBusyId(row.id);
    setError(null);
    try {
      const { title, snapshot } = await loadFacture(supabase, row.id);
      applySnapshot(snapshot, row.id, title);
      router.push("/tools/factures");
    } catch (err) {
      setError(`Ouverture impossible : ${(err as Error).message}`);
      setBusyId(null);
    }
  };

  const handleDelete = async (row: FactureListRow) => {
    if (!supabase) return;
    if (!window.confirm(`Supprimer définitivement « ${row.title} » ?`)) return;
    setBusyId(row.id);
    setError(null);
    try {
      await deleteFacture(supabase, row.id);
      // Si le document supprimé était ouvert dans l'éditeur, on le
      // détache pour qu'une future sauvegarde recrée une ligne proprement.
      if (useFactureStore.getState().docId === row.id) {
        setDocMeta(null, useFactureStore.getState().docTitle);
      }
      await refresh();
    } catch (err) {
      setError(`Suppression impossible : ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-content-primary">
          Liste des documents
        </h1>
        <Link href="/tools/factures?new=1">
          <Button variant="accent" size="sm">
            <FilePlus2 className="h-4 w-4" />
            Nouveau document
          </Button>
        </Link>
      </div>

      {!supabase ? (
        <p className="glass rounded-glass p-6 text-sm text-content-secondary">
          Supabase n&apos;est pas configuré (.env.local).
        </p>
      ) : session === undefined ? (
        <div className="glass flex h-32 items-center justify-center rounded-glass">
          <Loader2 className="h-5 w-5 animate-spin text-content-secondary" />
        </div>
      ) : session === null ? (
        <p className="glass rounded-glass p-6 text-sm text-content-secondary">
          Connectez-vous pour voir les documents, via le bouton
          « Connexion » en haut à droite.
        </p>
      ) : rows === null ? (
        <div className="glass flex h-32 items-center justify-center rounded-glass">
          <Loader2 className="h-5 w-5 animate-spin text-content-secondary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="glass rounded-glass p-6 text-sm text-content-secondary">
          Aucun document enregistré pour l&apos;instant. Rédigez-en un puis
          enregistrez-le via le bouton nuage de l&apos;éditeur.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="glass flex items-center gap-3 rounded-glass p-4"
            >
              <ReceiptText className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content-primary">
                  {row.title}
                </p>
                <p className="text-xs text-content-secondary">
                  Modifié le {formatDate(row.updated_at)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={busyId !== null}
                onClick={() => handleOpen(row)}
              >
                {busyId === row.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ouvrir"
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Supprimer ${row.title}`}
                disabled={busyId !== null}
                onClick={() => handleDelete(row)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
