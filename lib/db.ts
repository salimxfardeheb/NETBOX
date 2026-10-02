import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Client Prisma unique, branché sur Neon via le driver serverless
 * (@prisma/adapter-neon). Réutilisé entre les rechargements à chaud du
 * dev server pour ne pas rouvrir un pool à chaque édition.
 *
 * Node 22+ expose un WebSocket global : le driver Neon s'en sert
 * directement, aucun paquet `ws` n'est nécessaire.
 *
 * Le client est créé à la première requête (jamais à l'import) : sans
 * DATABASE_URL, les routes répondent « non configuré » au lieu de
 * planter, et l'app reste utilisable hors ligne.
 */

// Les requêtes simples passent par HTTP (une seule aller-retour) ;
// les transactions basculent automatiquement sur WebSocket.
neonConfig.poolQueryViaFetch = true;

/** True si la base est configurée (DATABASE_URL dans .env.local). */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Client Prisma partagé (créé à la demande). */
export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquant (.env.local).");

  const client = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });
  globalForPrisma.prisma = client;
  return client;
}
