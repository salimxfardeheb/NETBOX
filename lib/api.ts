import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";

/**
 * Briques communes aux routes /api : réponses d'erreur homogènes et
 * garde d'authentification. Le front n'affiche que `error`.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export type AuthResult =
  | { user: { id: string; pseudo: string } }
  | { error: NextResponse };

/**
 * Exige une base configurée ET une session valide.
 * Usage : `const auth = await requireUser(); if ("error" in auth) return auth.error;`
 */
export async function requireUser(): Promise<AuthResult> {
  if (!isDatabaseConfigured()) {
    return {
      error: jsonError("Base de données non configurée (DATABASE_URL).", 503),
    };
  }
  const user = await getSessionUser();
  if (!user) return { error: jsonError("Connexion requise.", 401) };
  return { user };
}

/** Erreur inattendue (base injoignable, requête invalide…) → 500 loggé. */
export function serverError(context: string, err: unknown): NextResponse {
  console.error(`[api] ${context}`, err);
  return jsonError(`${context} : ${(err as Error).message}`, 500);
}

/** Corps attendu par les routes d'enregistrement (CVs et factures). */
export interface SavePayload {
  id: string | null;
  title: string;
  data: unknown;
}

/** Valide le corps JSON d'un enregistrement. Retourne null si invalide. */
export function parseSavePayload(body: unknown): SavePayload | null {
  if (typeof body !== "object" || body === null) return null;
  const { id, title, data } = body as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) return null;
  if (typeof data !== "object" || data === null) return null;
  if (id !== undefined && id !== null && typeof id !== "string") return null;

  return {
    id: typeof id === "string" && isUuid(id) ? id : null,
    title: title.trim(),
    data,
  };
}
