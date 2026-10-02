/**
 * Appels aux routes /api depuis le navigateur.
 * Les routes répondent `{ error }` avec un statut HTTP : on remonte ce
 * message tel quel pour l'afficher dans l'UI.
 */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers:
      init?.body !== undefined
        ? { "Content-Type": "application/json", ...init?.headers }
        : init?.headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? `Erreur ${response.status}`);
  }
  if (payload === null) throw new Error("Réponse illisible du serveur.");
  return payload;
}
