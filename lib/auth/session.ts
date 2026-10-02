import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db";

/**
 * Session applicative : un cookie httpOnly signé (HMAC-SHA256 avec
 * AUTH_SECRET) contenant l'id et le pseudo du compte. Aucun jeton à
 * rafraîchir : pas de middleware, le cookie est vérifié directement
 * par les routes /api.
 */

export const SESSION_COOKIE = "netbox_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export interface SessionPayload {
  uid: string;
  pseudo: string;
  /** Expiration, en millisecondes epoch. */
  exp: number;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET manquant ou trop court (32+ caractères attendus dans .env.local)."
    );
  }
  return value;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createSessionToken(user: {
  id: string;
  pseudo: string;
}): string {
  const payload: SessionPayload = {
    uid: user.id,
    pseudo: user.pseudo,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Vérifie la signature et l'expiration du jeton. */
export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (!payload.uid || !payload.pseudo || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Session du cookie courant, sans aller en base. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Compte réellement présent en base derrière la session courante.
 * null si le cookie est absent/invalide ou si le compte a été supprimé
 * (un vieux cookie ne doit jamais donner accès aux données).
 */
export async function getSessionUser(): Promise<{
  id: string;
  pseudo: string;
} | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await getPrisma().user.findUnique({
    where: { id: session.uid },
    select: { id: true, pseudo: true },
  });
  return user;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
