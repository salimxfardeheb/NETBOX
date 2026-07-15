"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Cloud, CloudUpload, List, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCVStore } from "../lib/store";
import { saveCV } from "../lib/cloud";

/**
 * Connexion + Enregistrer/Charger le CV en ligne (Supabase).
 * Login par pseudo + mot de passe : le pseudo est mappé sur un email
 * synthétique interne (`pseudo@pseudo.simoux.local`) — l'utilisateur ne
 * voit jamais d'email. La sécurité des données repose sur la RLS.
 */

// Supabase valide le domaine des emails (DNS) : un domaine fictif est
// rejeté. On mappe donc chaque pseudo sur une sous-adresse Gmail réelle
// (adresse+pseudo@gmail.com), traitée comme un compte distinct.
const PSEUDO_EMAIL_BASE = "salimfardeheb442";
const PSEUDO_EMAIL_DOMAIN = "gmail.com";
// Le "+" Gmail n'accepte pas les tirets/underscores partout : on reste
// sur lettres + chiffres.
const PSEUDO_RE = /^[a-z0-9]{3,20}$/;

function pseudoToEmail(pseudo: string): string {
  return `${PSEUDO_EMAIL_BASE}+${pseudo.toLowerCase()}@${PSEUDO_EMAIL_DOMAIN}`;
}

function pseudoFromSession(session: Session): string {
  const meta = session.user.user_metadata?.pseudo;
  if (typeof meta === "string" && meta) return meta;
  // Fallback : extrait le pseudo de "base+pseudo@gmail.com".
  const local = session.user.email?.split("@")[0] ?? "";
  return local.split("+")[1] ?? local ?? "?";
}

type Status = { kind: "ok" | "error"; text: string } | null;

export function CloudControls() {
  const cvId = useCVStore((s) => s.cvId);
  const cvTitle = useCVStore((s) => s.cvTitle);
  const setCvMeta = useCVStore((s) => s.setCvMeta);

  // Client créé une seule fois, seulement si la config existe.
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (supabaseRef.current === null && isSupabaseConfigured()) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"auth" | "save" | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

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

  // Supabase non configuré : le module reste 100 % hors-ligne.
  if (!supabase) return null;

  const handleAuth = async (mode: "signin" | "signup") => {
    const cleanPseudo = pseudo.trim().toLowerCase();
    if (!PSEUDO_RE.test(cleanPseudo)) {
      setStatus({
        kind: "error",
        text: "Pseudo : 3 à 20 caractères, lettres et chiffres uniquement.",
      });
      return;
    }
    if (password.length < 6) {
      setStatus({ kind: "error", text: "Mot de passe : 6 caractères minimum." });
      return;
    }
    setBusy("auth");
    setStatus(null);
    try {
      const email = pseudoToEmail(cleanPseudo);
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setStatus({ kind: "error", text: "Pseudo ou mot de passe incorrect." });
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { pseudo: cleanPseudo } },
        });
        if (error) {
          setStatus({
            kind: "error",
            text: error.message.includes("already registered")
              ? "Ce pseudo est déjà pris."
              : `Inscription impossible : ${error.message}`,
          });
          return;
        }
        if (!data.session) {
          // "Confirm email" est resté activé côté Supabase : l'email
          // synthétique ne recevra jamais le lien de confirmation.
          setStatus({
            kind: "error",
            text: "Désactivez « Confirm email » dans Supabase (Auth → Sign In / Up).",
          });
          return;
        }
      }
      setPseudo("");
      setPassword("");
      setStatus({ kind: "ok", text: "Connecté." });
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStatus(null);
  };

  const handleSave = async () => {
    if (!session) return;
    setBusy("save");
    setStatus(null);
    try {
      const state = useCVStore.getState();
      // Titre par défaut : "CV Prénom Nom" si dispo, sinon "Mon CV".
      const fallback =
        `CV ${state.data.basics.firstName} ${state.data.basics.lastName}`.trim();
      const title = cvTitle.trim() || (fallback !== "CV" ? fallback : "Mon CV");

      const id = await saveCV(supabase, session, state.data, title, cvId);
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
      setBusy(null);
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
        title={session ? `Connecté : ${pseudoFromSession(session)}` : "Sauvegarde en ligne"}
      >
        <Cloud className="h-4 w-4" />
        <span className="hidden md:inline">
          {session ? pseudoFromSession(session) : "Connexion"}
        </span>
      </Button>

      {open && (
        <div className="glass absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 rounded-xl p-3 shadow-lg">
          {session ? (
            <div className="space-y-2">
              <p className="text-xs text-content-secondary">
                Connecté : <span className="font-medium text-content-primary">{pseudoFromSession(session)}</span>
              </p>
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
                disabled={busy !== null}
                onClick={handleSave}
              >
                {busy === "save" ? (
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
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                disabled={busy !== null}
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Se déconnecter
              </Button>
            </div>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleAuth("signin");
              }}
            >
              <p className="text-xs text-content-secondary">
                Sauvegardez votre CV en ligne avec un pseudo.
              </p>
              <input
                className={fieldClasses}
                value={pseudo}
                placeholder="Pseudo"
                autoComplete="username"
                onChange={(e) => setPseudo(e.target.value)}
              />
              <input
                className={fieldClasses}
                type="password"
                value={password}
                placeholder="Mot de passe"
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  type="submit"
                  disabled={busy !== null}
                >
                  {busy === "auth" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Connexion
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={busy !== null}
                  onClick={() => handleAuth("signup")}
                >
                  Créer un compte
                </Button>
              </div>
            </form>
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
