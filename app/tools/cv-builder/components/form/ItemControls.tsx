"use client";

import { FaGripVertical, FaTrashAlt } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { useDragHandle } from "./SortableList";

/**
 * Contrôles d'un élément de liste, réunis dans une barre d'outils visible :
 * une poignée de déplacement (glisser-déposer) et la suppression.
 * La poignée n'apparaît que dans une liste triable (contexte SortableRow).
 */
export function ItemControls({ onRemove }: { onRemove: () => void }) {
  const handle = useDragHandle();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-glass-border bg-surface p-0.5">
      {handle && (
        <>
          <Button
            ref={handle.setActivatorNodeRef}
            variant="ghost"
            size="icon-sm"
            className="cursor-grab active:cursor-grabbing"
            aria-label="Déplacer"
            title="Déplacer (glisser)"
            {...handle.attributes}
            {...handle.listeners}
          >
            <FaGripVertical className="h-4 w-4" />
          </Button>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-glass-border" />
        </>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className="hover:bg-red-400/10 hover:text-red-400"
        onClick={onRemove}
        aria-label="Supprimer"
        title="Supprimer"
      >
        <FaTrashAlt className="h-4 w-4" />
      </Button>
    </div>
  );
}
