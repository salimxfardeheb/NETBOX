"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";

/**
 * Props de la poignée de glisser-déposer, exposées par `SortableRow`
 * à ses descendants (typiquement le bouton grip d'`ItemControls`) —
 * ainsi la poignée vit dans le cluster de contrôles, à droite.
 */
type DragHandle = {
  setActivatorNodeRef: (el: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

const DragHandleContext = createContext<DragHandle | null>(null);

/** Poignée de drag de la rangée courante, ou null hors d'une SortableRow. */
export function useDragHandle(): DragHandle | null {
  return useContext(DragHandleContext);
}

/**
 * Liste triable par glisser-déposer. Les ids sont dérivés des index
 * (stables pendant un drag car la liste n'est réordonnée qu'au drop).
 */
export function SortableList({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (from: number, to: number) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/**
 * Rangée triable. La poignée de drag n'est plus rendue ici : elle est
 * fournie via le contexte à un descendant (le grip d'`ItemControls`),
 * pour regrouper « déplacer » et « supprimer » dans un même cluster.
 */
export function SortableRow({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("min-w-0", isDragging && "z-10 opacity-60", className)}
    >
      <DragHandleContext.Provider value={{ setActivatorNodeRef, attributes, listeners }}>
        {children}
      </DragHandleContext.Provider>
    </div>
  );
}
