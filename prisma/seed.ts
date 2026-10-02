import { hashPassword } from "../lib/auth/password";
import { createScriptPrisma } from "../scripts/client";

/**
 * Compte d'accès initial de la plateforme (il n'y a pas d'inscription
 * publique). Pour créer d'autres comptes ou réparer un mot de passe
 * oublié, préférer `npm run account:reset` : la saisie y est masquée.
 *
 *   npm run db:seed                        → netbox / netbox
 *   SEED_PSEUDO=x SEED_PASSWORD=y npm run db:seed
 */
async function main() {
  const prisma = createScriptPrisma();
  const pseudo = (process.env.SEED_PSEUDO ?? "netbox").toLowerCase();
  const passwordHash = await hashPassword(process.env.SEED_PASSWORD ?? "netbox");

  const user = await prisma.user.upsert({
    where: { pseudo },
    update: { passwordHash },
    create: { pseudo, passwordHash },
  });

  console.log(`Compte « ${user.pseudo} » prêt (mot de passe mis à jour).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
