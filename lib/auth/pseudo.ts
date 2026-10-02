/**
 * Règles du pseudo, partagées par le formulaire de connexion et les
 * routes d'API : un compte = un pseudo (table `users`), pas d'email.
 */

export const PSEUDO_RE = /^[a-z0-9]{3,20}$/;

/** Longueur minimale du mot de passe. */
export const PASSWORD_MIN_LENGTH = 6;

/** Normalise la saisie (espaces, casse) avant validation ou requête. */
export function normalizePseudo(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Retourne un message d'erreur à afficher, ou null si la saisie est valide. */
export function validateCredentials(
  pseudo: string,
  password: string
): string | null {
  if (!PSEUDO_RE.test(pseudo)) {
    return "Pseudo : 3 à 20 caractères, lettres et chiffres uniquement.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Mot de passe : ${PASSWORD_MIN_LENGTH} caractères minimum.`;
  }
  return null;
}
