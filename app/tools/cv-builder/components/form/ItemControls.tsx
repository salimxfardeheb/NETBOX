"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Contrôles communs d'un élément de liste : monter, descendre, supprimer.
 */
export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        disabled={index === 0}
        onClick={() => onMove("up")}
        aria-label="Monter"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        disabled={index === count - 1}
        onClick={() => onMove("down")}
        aria-label="Descendre"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:text-red-400"
        onClick={onRemove}
        aria-label="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
