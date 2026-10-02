# NETBOX

Shell de tableau de bord modulaire, design **Apple glassmorphism**.
Squelette extensible prêt à accueillir des modules d'outils — sans aucune
logique métier.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** (tout custom, pas de librairie de composants)
- **lucide-react** pour les icônes
- **Prisma** (ORM) sur **Neon** (PostgreSQL serverless)
- Auth maison : pseudo + mot de passe, cookie de session signé

## Démarrer

```bash
npm install          # installe + génère le client Prisma
cp .env.local.example .env.local   # puis remplir DATABASE_URL et AUTH_SECRET
npm run db:deploy    # applique les migrations sur Neon
npm run db:seed      # crée le compte d'accès (netbox / netbox par défaut)
                     # ou : npm run account:reset -- <pseudo> --create
npm run dev
```

L'app démarre sur [http://localhost:3000](http://localhost:3000).
Sans `DATABASE_URL`, l'app reste utilisable : les modules fonctionnent
hors ligne, seuls les contrôles de sauvegarde en ligne disparaissent.

## Base de données

La base Neon est décrite par [`prisma/schema.prisma`](prisma/schema.prisma) :
`users` (comptes), `cvs` et `factures` (une colonne `data` en JSON par
document). L'URL de connexion vient de `DATABASE_URL`, lue par l'app et
par la CLI Prisma via [`prisma.config.ts`](prisma.config.ts).

| Commande | Effet |
| --- | --- |
| `npm run db:migrate` | crée + applique une migration (dev) |
| `npm run db:deploy` | applique les migrations existantes |
| `npm run db:seed` | crée le compte initial (`SEED_PSEUDO`, `SEED_PASSWORD`) |
| `npm run db:studio` | explore les données dans Prisma Studio |

## Comptes

Il n'y a **pas d'inscription publique** : les comptes se gèrent en ligne
de commande ([`scripts/account.ts`](scripts/account.ts)). Le mot de passe
est demandé au clavier en saisie masquée — il ne passe donc jamais par
l'historique du shell ni par un fichier.

```bash
npm run account:list                        # comptes existants
npm run account:reset -- <pseudo>           # mot de passe oublié
npm run account:reset -- <pseudo> --create  # nouveau compte
```

Le `--` après le nom du script est nécessaire pour que npm transmette
les arguments au lieu de les interpréter.

Tout compte connecté voit et modifie l'ensemble des CVs et des documents
(base partagée).

## Architecture

```
app/
├── layout.tsx          # <html>, fond + orbs, sidebar, topbar, zone de contenu
├── globals.css         # tokens CSS, classe .glass, reset
├── page.tsx            # page d'accueil (état vide élégant)
├── tools/              # un dossier par module (voir tools/README.md)
└── api/                # routes serveur (auth + données, via Prisma)
components/
├── layout/
│   ├── Background.tsx  # fond sombre + orbs flous (fixed, derrière tout)
│   ├── Sidebar.tsx     # navigation glass, pilotée par le registre
│   └── Topbar.tsx      # barre supérieure glass (titre + slot actions)
└── ui/
    ├── Button.tsx      # bouton glass réutilisable
    └── Card.tsx        # carte glass réutilisable
lib/
├── auth/               # mot de passe (scrypt), cookie de session, pseudo
├── db.ts               # client Prisma branché sur Neon
├── api.ts              # garde d'auth + réponses d'erreur des routes
├── api-client.ts       # appels /api côté navigateur
├── tools-registry.ts   # registre des modules (source unique de la nav)
└── cn.ts               # petit helper de classes
prisma/
├── schema.prisma       # modèles User / Cv / Facture
├── migrations/         # historique SQL appliqué à Neon
└── seed.ts             # compte d'accès initial
scripts/
├── account.ts          # lister les comptes, créer / réinitialiser un mot de passe
├── client.ts           # client Prisma des scripts CLI
└── prompt.ts           # saisie masquée au clavier
```

## Design system

Les tokens sont définis comme variables CSS dans
[`app/globals.css`](app/globals.css) et exposés en classes Tailwind via
[`tailwind.config.ts`](tailwind.config.ts) (`bg-glass`, `text-content-primary`,
`border-accent`, …). La classe `.glass` matérialise la surface frostée
partagée par la sidebar, la topbar et les cartes.

## Ajouter un module

Voir [`app/tools/README.md`](app/tools/README.md) : ajouter une entrée au
registre + créer une route sous `app/tools/`. Rien d'autre.
