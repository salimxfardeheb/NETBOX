import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hachage des mots de passe (scrypt, module natif de Node : aucune
 * dépendance externe). Format stocké en base :
 *   scrypt:<sel hex>:<empreinte hex>
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  // Comparaison à temps constant (les deux longueurs sont vérifiées
  // avant : timingSafeEqual lève si elles diffèrent).
  return key.length === expected.length && timingSafeEqual(key, expected);
}
