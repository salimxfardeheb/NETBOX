"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { FilePlus2, FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCVStore } from "../lib/store";
import { deleteCV, listCVs, loadCV, type CVListRow } from "../lib/cloud";

/**
 * Liste des CVs de la base partagée : tout compte connecté voit
 * l'ensemble des CVs et peut les ouvrir dans l'éditeur ou les supprimer.
 */
export default function CVListPage() {
  const router = useRouter();
  const setData = useCVStore((s) => s.setData);
  const setCvMeta = useCVStore((s) => s.setCvMeta);

  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (supabaseRef.current === null && isSupabaseConfigured()) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  // null = session pas encore connue (chargement).
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [rows, setRows] = useState<CVListRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      setRows(await listCVs(supabase));
    } catch (err) {
      setError(`Chargement de la liste : ${(err as Error).message}`);
    }
  }, [supabase]);

  useEffect(() => {
    if (session) void refresh();
  }, [session, refresh]);

  const handleOpen = async (row: CVListRow) => {
    if (!supabase) return;
    if (
      !window.confirm(
        `Ouvrir « ${row.title} » ? Le CV actuellement dans l'éditeur sera remplacé.`
      )
    ) {
      return;
    }
    setBusyId(row.id);
    setError(null);
    try {
      const { title, data } = await loadCV(supabase, row.id);
      setData(data);
      setCvMeta(row.id, title);
      router.push("/tools/cv-builder");
    } catch (err) {
      setError(`Ouverture impossible : ${(err as Error).message}`);
      setBusyId(null);
    }
  };

  const handleDelete = async (row: CVListRow) => {
    if (!supabase) return;
    if (!window.confirm(`Supprimer définitivement « ${row.title} » ?`)) return;
    setBusyId(row.id);
    setError(null);
    try {
      await deleteCV(supabase, row.id);
      // Si le CV supprimé était ouvert dans l'éditeur, on le détache
      // pour qu'une future sauvegarde recrée une ligne proprement.
      if (useCVStore.getState().cvId === row.id) {
        setCvMeta(null, useCVStore.getState().cvTitle);
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
          Liste des CVs
        </h1>
        <Link href="/tools/cv-builder?new=1">
          <Button variant="accent" size="sm">
            <FilePlus2 className="h-4 w-4" />
            Créer un CV
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
          Connectez-vous pour voir les CVs : ouvrez l&apos;
          <Link href="/tools/cv-builder" className="text-accent underline">
            éditeur
          </Link>{" "}
          puis utilisez le bouton nuage « Connexion » dans la barre du haut.
        </p>
      ) : rows === null ? (
        <div className="glass flex h-32 items-center justify-center rounded-glass">
          <Loader2 className="h-5 w-5 animate-spin text-content-secondary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="glass rounded-glass p-6 text-sm text-content-secondary">
          Aucun CV enregistré pour l&apos;instant. Créez-en un puis
          enregistrez-le via le bouton nuage de l&apos;éditeur.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="glass flex items-center gap-3 rounded-glass p-4"
            >
              <FileText className="h-5 w-5 shrink-0 text-accent" />
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
