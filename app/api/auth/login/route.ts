import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { normalizePseudo, validateCredentials } from "@/lib/auth/pseudo";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { jsonError, serverError } from "@/lib/api";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

/**
 * Connexion par pseudo + mot de passe (table `users`).
 * Aucune inscription publique : les comptes sont créés par le seed
 * (npm run db:seed) — équivalent du verrouillage « netbox » d'avant.
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return jsonError("Base de données non configurée (DATABASE_URL).", 503);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const pseudo = normalizePseudo(String(body.pseudo ?? ""));
    const password = String(body.password ?? "");

    const invalid = validateCredentials(pseudo, password);
    if (invalid) return jsonError(invalid, 400);

    const user = await getPrisma().user.findUnique({ where: { pseudo } });
    // Message identique dans les deux cas : ne pas révéler quels
    // pseudos existent.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError("Pseudo ou mot de passe incorrect.", 401);
    }

    await setSessionCookie(createSessionToken(user));
    return NextResponse.json({ pseudo: user.pseudo });
  } catch (err) {
    return serverError("Connexion impossible", err);
  }
}
