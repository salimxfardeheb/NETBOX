# NETBOX

Shell de tableau de bord modulaire, design **Apple glassmorphism**.
Squelette extensible prêt à accueillir des modules d'outils — sans aucune
logique métier.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** (tout custom, pas de librairie de composants)
- **lucide-react** pour les icônes
- Aucune DB, aucune auth, aucun backend

## Démarrer

```bash
npm install
npm run dev
```

L'app démarre sur [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
├── layout.tsx          # <html>, fond + orbs, sidebar, topbar, zone de contenu
├── globals.css         # tokens CSS, classe .glass, reset
├── page.tsx            # page d'accueil (état vide élégant)
└── tools/              # un dossier par module (voir tools/README.md)
components/
├── layout/
│   ├── Background.tsx  # fond sombre + orbs flous (fixed, derrière tout)
│   ├── Sidebar.tsx     # navigation glass, pilotée par le registre
│   └── Topbar.tsx      # barre supérieure glass (titre + slot actions)
└── ui/
    ├── Button.tsx      # bouton glass réutilisable
    └── Card.tsx        # carte glass réutilisable
lib/
├── tools-registry.ts   # registre des modules (source unique de la nav)
└── cn.ts               # petit helper de classes
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
