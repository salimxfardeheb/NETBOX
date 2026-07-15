import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Rafraîchit le token de session Supabase à chaque requête et
 * répercute les cookies mis à jour vers le navigateur.
 * Pattern officiel @supabase/ssr pour Next.js App Router.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Supabase pas encore configuré (.env.local absent ou URL invalide) :
  // ne rien faire, l'app doit continuer à fonctionner hors ligne.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !/^https?:\/\//.test(url)) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT : ne pas insérer de logique entre createServerClient et
  // getUser() — c'est cet appel qui déclenche le refresh du token.
  await supabase.auth.getUser();

  return supabaseResponse;
}
