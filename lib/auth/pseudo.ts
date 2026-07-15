import type { Session } from "@supabase/supabase-js";

/**
 * Mapping pseudo ↔ email synthétique, partagé par toute la plateforme.
 * L'utilisateur ne voit jamais d'email : il se connecte avec un pseudo,
 * mappé sur une sous-adresse Gmail réelle (adresse+pseudo@gmail.com),
 * traitée par Supabase comme un compte distinct.
 */

// Supabase valide le domaine des emails (DNS) : un domaine fictif est
// rejeté, d'où la sous-adresse Gmail réelle.
const PSEUDO_EMAIL_BASE = "salimfardeheb442";
const PSEUDO_EMAIL_DOMAIN = "gmail.com";

// Le "+" Gmail n'accepte pas les tirets/underscores partout : on reste
// sur lettres + chiffres.
export const PSEUDO_RE = /^[a-z0-9]{3,20}$/;

export function pseudoToEmail(pseudo: string): string {
  return `${PSEUDO_EMAIL_BASE}+${pseudo.toLowerCase()}@${PSEUDO_EMAIL_DOMAIN}`;
}

export function pseudoFromSession(session: Session): string {
  const meta = session.user.user_metadata?.pseudo;
  if (typeof meta === "string" && meta) return meta;
  // Fallback : extrait le pseudo de "base+pseudo@gmail.com".
  const local = session.user.email?.split("@")[0] ?? "";
  return local.split("+")[1] ?? local ?? "?";
}
