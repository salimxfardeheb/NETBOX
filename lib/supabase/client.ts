import { createBrowserClient } from "@supabase/ssr";

/**
 * Clé publique du projet : nouveau nom (PUBLISHABLE_KEY, clés
 * sb_publishable_...) ou ancien (ANON_KEY) — les deux sont acceptés.
 * Les deux accès doivent rester des expressions statiques complètes
 * pour que Next les inline côté navigateur.
 */
export function supabasePublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** True si les variables Supabase sont renseignées (.env.local). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && /^https?:\/\//.test(url) && supabasePublicKey());
}

/**
 * Client Supabase côté navigateur (@supabase/ssr).
 * La session est stockée en cookies, partagée avec le middleware
 * et les éventuels Server Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabasePublicKey()!
  );
}
