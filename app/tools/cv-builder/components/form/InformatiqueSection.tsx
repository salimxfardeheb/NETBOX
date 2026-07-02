"use client";

import { FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { useCVStore } from "../../lib/store";
import { FormSection } from "./FormSection";
import { ItemControls } from "./ItemControls";
import { SortableList, SortableRow } from "./SortableList";
import { Field, TextInput } from "./fields";

export function InformatiqueSection() {
  const categories = useCVStore((s) => s.data.informatique);
  const addItem = useCVStore((s) => s.addItem);
  const updateItem = useCVStore((s) => s.updateItem);
  const removeItem = useCVStore((s) => s.removeItem);
  const reorderItem = useCVStore((s) => s.reorderItem);

  const ids = categories.map((_, i) => `info-${i}`);

  return (
    <FormSection title="Informatique / Compétences">
      <SortableList ids={ids} onReorder={(from, to) => reorderItem("informatique", from, to)}>
        <div className="space-y-3">
          {categories.map((category, index) => (
            <SortableRow key={ids[index]} id={ids[index]}>
              <div className="flex items-end gap-2 rounded-xl border border-glass-border bg-surface p-3">
                <Field label="Catégorie" className="w-44">
                  <TextInput
                    value={category.label}
                    placeholder="Systèmes"
                    onChange={(e) =>
                      updateItem("informatique", index, { label: e.target.value })
                    }
                  />
                </Field>
                <Field label="Compétences" className="flex-1">
                  <TextInput
                    value={category.items}
                    placeholder="Windows, Linux, macOS…"
                    onChange={(e) =>
                      updateItem("informatique", index, { items: e.target.value })
                    }
                  />
                </Field>
                <div className="pb-1">
                  <ItemControls onRemove={() => removeItem("informatique", index)} />
                </div>
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableList>

      <Button
        variant="add"
        size="sm"
        className="w-full"
        onClick={() => addItem("informatique")}
      >
        <FaPlus className="h-4 w-4" />
        Ajouter une catégorie
      </Button>
    </FormSection>
  );
}
