import { hashPassword } from "../lib/auth/password";
import { PASSWORD_MIN_LENGTH, PSEUDO_RE } from "../lib/auth/pseudo";
import { createScriptPrisma } from "./client";
import { createHiddenPrompt } from "./prompt";

/**
 * Gestion des comptes de la plateforme (il n'y a pas d'inscription
 * publique — c'est ici qu'on crée un compte ou qu'on répare un mot de
 * passe oublié).
 *
 *   npm run account:list                    liste les comptes existants
 *   npm run account:reset <pseudo>          change le mot de passe
 *   npm run account:reset <pseudo> --create crée le compte s'il manque
 *
 * Le mot de passe est demandé au clavier, en saisie masquée : il
 * n'apparaît jamais dans l'historique du shell ni dans un fichier.
 */

const USAGE = `Usage :
  npm run account:list
  npm run account:reset <pseudo> [--create]`;

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const prisma = createScriptPrisma();

  try {
    if (command === "list") {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          pseudo: true,
          createdAt: true,
          _count: { select: { cvs: true, factures: true } },
        },
      });

      if (users.length === 0) {
        console.log("Aucun compte. Créez-en un :");
        console.log("  npm run account:reset <pseudo> --create");
        return;
      }

      console.log(`${users.length} compte(s) :`);
      for (const user of users) {
        const date = user.createdAt.toLocaleDateString("fr-FR");
        console.log(
          `  ${user.pseudo.padEnd(20)} créé le ${date}` +
            `  —  ${user._count.cvs} CV, ${user._count.factures} document(s)`
        );
      }
      return;
    }

    if (command === "reset") {
      const pseudo = (rest.find((arg) => !arg.startsWith("--")) ?? "").toLowerCase();
      const allowCreate = rest.includes("--create");

      if (!PSEUDO_RE.test(pseudo)) {
        throw new Error(
          `Pseudo invalide : 3 à 20 caractères, lettres minuscules et chiffres.\n${USAGE}`
        );
      }

      const existing = await prisma.user.findUnique({ where: { pseudo } });
      if (!existing && !allowCreate) {
        const others = await prisma.user.findMany({ select: { pseudo: true } });
        const known = others.map((u) => u.pseudo).join(", ") || "aucun";
        throw new Error(
          `Compte « ${pseudo} » introuvable (comptes existants : ${known}).\n` +
            `Pour le créer : npm run account:reset ${pseudo} --create`
        );
      }

      const prompt = createHiddenPrompt();
      let password: string;
      try {
        password = await prompt.ask(`Nouveau mot de passe pour « ${pseudo} » : `);
        if (password.length < PASSWORD_MIN_LENGTH) {
          throw new Error(
            `Mot de passe : ${PASSWORD_MIN_LENGTH} caractères minimum.`
          );
        }
        const confirmation = await prompt.ask("Confirmer le mot de passe : ");
        if (password !== confirmation) {
          throw new Error("Les deux saisies diffèrent — rien n'a été modifié.");
        }
      } finally {
        prompt.close();
      }

      const passwordHash = await hashPassword(password);
      await prisma.user.upsert({
        where: { pseudo },
        update: { passwordHash },
        create: { pseudo, passwordHash },
      });

      console.log(
        existing
          ? `Mot de passe de « ${pseudo} » mis à jour.`
          : `Compte « ${pseudo} » créé.`
      );
      return;
    }

    throw new Error(USAGE);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
