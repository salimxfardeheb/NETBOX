# Modules (outils)

Chaque outil est un module **hermétique** : il vit dans son propre dossier
et ne doit **jamais** importer un autre module. Tout ce qui est partagé
(boutons, cartes, helpers) se trouve dans `components/ui/` et `lib/`.

## Ajouter un outil

1. **Enregistrer l'outil** dans [`lib/tools-registry.ts`](../../lib/tools-registry.ts) :

   ```ts
   import { Wrench } from "lucide-react";

   export const tools: Tool[] = [
     // ...existant
     {
       id: "mon-outil",
       label: "Mon outil",
       icon: Wrench,
       path: "/tools/mon-outil",
       enabled: true,
     },
   ];
   ```

2. **Créer la route** correspondante :

   ```
   app/tools/mon-outil/page.tsx
   ```

   ```tsx
   export default function MonOutilPage() {
     return <div>…</div>;
   }
   ```

La sidebar et la topbar se mettent à jour automatiquement à partir du
registre — aucune autre modification n'est nécessaire.

Mettre `enabled: false` affiche l'entrée grisée et non cliquable
(« bientôt disponible »).
