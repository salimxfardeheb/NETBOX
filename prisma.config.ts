import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// La CLI Prisma ne lit pas les fichiers .env de Next : on charge
// .env.local (source de vérité du projet) puis .env en secours.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
