import { LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * Home / dashboard placeholder.
 * Deliberately empty of business logic — it only demonstrates the
 * glass surfaces and gives the shell a graceful "nothing selected" state.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center p-4">
      <Card className="flex max-w-md flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <LayoutGrid className="h-7 w-7" aria-hidden="true" />
        </div>

        <h2 className="text-xl font-semibold text-content-primary">
          Bienvenue sur NETBOX
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          Votre espace de travail est prêt. Sélectionnez un outil dans le menu
          de gauche pour commencer — de nouveaux modules apparaîtront ici dès
          qu&apos;ils seront ajoutés au registre.
        </p>
      </Card>
    </div>
  );
}
