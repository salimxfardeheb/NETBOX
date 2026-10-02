"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "./AuthProvider";

/**
 * Bouton de connexion global (Topbar) : formulaire pseudo + mot de passe
 * en popover, affichage du pseudo et déconnexion une fois connecté.
 * Toute l'app partage cette session via AuthProvider.
 */

type Status = { kind: "ok" | "error"; text: string } | null;

export function AuthMenu() {
  const { configured, pseudo, signIn, signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const [pseudoInput, setPseudoInput] = useState("");
  const [password, setPassword] = useState("");
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

  // Base non configurée (DATABASE_URL) : l'app reste 100 % hors-ligne.
  if (configured === false) return null;

  const handleSignIn = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const error = await signIn(pseudoInput, password);
      if (error) {
        setStatus({ kind: "error", text: error });
        return;
      }
      setPseudoInput("");
      setPassword("");
      setStatus({ kind: "ok", text: "Connecté." });
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setStatus(null);
  };

  const fieldClasses =
    "w-full rounded-lg border border-glass-border bg-field px-3 py-2 text-sm text-content-primary " +
    "placeholder:text-content-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={pseudo ? `Connecté : ${pseudo}` : "Connexion"}
      >
        <UserRound className="h-4 w-4" />
        <span className="hidden md:inline">{pseudo ?? "Connexion"}</span>
      </Button>

      {open && (
        <div className="glass-solid absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 rounded-xl p-3 shadow-lg">
          {pseudo ? (
            <div className="space-y-2">
              <p className="text-xs text-content-secondary">
                Connecté :{" "}
                <span className="font-medium text-content-primary">
                  {pseudo}
                </span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                disabled={busy}
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
                handleSignIn();
              }}
            >
              <p className="text-xs text-content-secondary">
                Connectez-vous pour sauvegarder vos documents en ligne.
              </p>
              <input
                className={fieldClasses}
                value={pseudoInput}
                placeholder="Pseudo"
                autoComplete="username"
                onChange={(e) => setPseudoInput(e.target.value)}
              />
              <input
                className={fieldClasses}
                type="password"
                value={password}
                placeholder="Mot de passe"
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                variant="accent"
                size="sm"
                className="w-full"
                type="submit"
                disabled={busy}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Connexion
              </Button>
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
