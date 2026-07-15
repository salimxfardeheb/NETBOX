"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { PSEUDO_RE, pseudoFromSession, pseudoToEmail } from "@/lib/auth/pseudo";

/**
 * Authentification globale de la plateforme : un seul client Supabase,
 * une seule session, partagés par tous les modules via useAuth().
 * Les modules ne gèrent plus la connexion — seulement leurs données.
 */

type AuthContextValue = {
  /** null si Supabase n'est pas configuré (.env.local absent). */
  supabase: SupabaseClient | null;
  /** undefined = session pas encore connue (chargement). */
  session: Session | null | undefined;
  /** Pseudo du compte connecté, sinon null. */
  pseudo: string | null;
  /** Retourne un message d'erreur à afficher, ou null si OK. */
  signIn: (pseudo: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function validateCredentials(pseudo: string, password: string): string | null {
  if (!PSEUDO_RE.test(pseudo)) {
    return "Pseudo : 3 à 20 caractères, lettres et chiffres uniquement.";
  }
  if (password.length < 6) return "Mot de passe : 6 caractères minimum.";
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Client créé une seule fois, seulement si la config existe.
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (supabaseRef.current === null && isSupabaseConfigured()) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      session,
      pseudo: session ? pseudoFromSession(session) : null,

      async signIn(rawPseudo, password) {
        if (!supabase) return "Supabase n'est pas configuré.";
        const pseudo = rawPseudo.trim().toLowerCase();
        const invalid = validateCredentials(pseudo, password);
        if (invalid) return invalid;
        const { error } = await supabase.auth.signInWithPassword({
          email: pseudoToEmail(pseudo),
          password,
        });
        return error ? "Pseudo ou mot de passe incorrect." : null;
      },

      async signOut() {
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [supabase, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return ctx;
}
