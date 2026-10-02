import { config as loadEnv } from "dotenv";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";

/**
 * Client Prisma pour les scripts en ligne de commande (seed, gestion
 * des comptes). Ces scripts tournent hors de Next : ils chargent
 * eux-mêmes .env.local pour récupérer DATABASE_URL.
 */
export function createScriptPrisma(): PrismaClient {
  loadEnv({ path: ".env.local", quiet: true });
  loadEnv({ quiet: true });

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquant (.env.local).");

  neonConfig.poolQueryViaFetch = true;
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}
