"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api-client";
import { validateCredentials } from "@/lib/auth/pseudo";

/**
 * Authentification globale de la plateforme : une seule session
 * (cookie httpOnly posé par /api/auth/login), partagée par tous les
 * modules via useAuth(). Les modules ne gèrent plus la connexion —
 * seulement leurs données, via leurs routes /api.
 */

type SessionResponse = { configured: boolean; pseudo: string | null };

type AuthContextValue = {
  /**
   * false si la base n'est pas configurée (DATABASE_URL absent) :
   * l'app reste utilisable, sans sauvegarde en ligne.
   * undefined tant que /api/auth/session n'a pas répondu.
   */
  configured: boolean | undefined;
  /** undefined = session pas encore connue, null = déconnecté. */
  pseudo: string | null | undefined;
  /** Retourne un message d'erreur à afficher, ou null si OK. */
  signIn: (pseudo: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [configured, setConfigured] = useState<boolean | undefined>(undefined);
  const [pseudo, setPseudo] = useState<string | null | undefined>(undefined);

  // État de session au montage : le cookie n'est pas lisible en JS
  // (httpOnly), c'est le serveur qui fait autorité.
  useEffect(() => {
    let cancelled = false;
    apiFetch<SessionResponse>("/api/auth/session")
      .then((data) => {
        if (cancelled) return;
        setConfigured(data.configured);
        setPseudo(data.pseudo);
      })
      .catch(() => {
        if (cancelled) return;
        setConfigured(false);
        setPseudo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (rawPseudo: string, password: string) => {
    const candidate = rawPseudo.trim().toLowerCase();
    const invalid = validateCredentials(candidate, password);
    if (invalid) return invalid;

    try {
      const data = await apiFetch<{ pseudo: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ pseudo: candidate, password }),
      });
      setPseudo(data.pseudo);
      setConfigured(true);
      return null;
    } catch (err) {
      return (err as Error).message;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setPseudo(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ configured, pseudo, signIn, signOut }),
    [configured, pseudo, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return ctx;
}
