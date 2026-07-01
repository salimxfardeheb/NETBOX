"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCVStore, type StringSection } from "../../lib/store";
import { FormSection } from "./FormSection";
import { ItemControls } from "./ItemControls";
import { SortableList, SortableRow } from "./SortableList";
import { TextInput } from "./fields";

/**
 * Section générique pour les listes de chaînes —
 * utilisée pour les atouts ET les centres d'intérêt.
 */
export function StringListSection({
  section,
  title,
  addLabel,
  placeholder,
}: {
  section: StringSection;
  title: string;
  addLabel: string;
  placeholder: string;
}) {
  const values = useCVStore((s) => s.data[section]);
  const addString = useCVStore((s) => s.addString);
  const updateString = useCVStore((s) => s.updateString);
  const removeString = useCVStore((s) => s.removeString);
  const moveString = useCVStore((s) => s.moveString);
  const reorderString = useCVStore((s) => s.reorderString);

  const ids = values.map((_, i) => `${section}-${i}`);

  return (
    <FormSection title={title}>
      <SortableList ids={ids} onReorder={(from, to) => reorderString(section, from, to)}>
        <div className="space-y-2">
          {values.map((value, index) => (
            <SortableRow key={ids[index]} id={ids[index]}>
              <div className="flex items-center gap-2">
                <TextInput
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => updateString(section, index, e.target.value)}
                />
                <ItemControls
                  index={index}
                  count={values.length}
                  onMove={(dir) => moveString(section, index, dir)}
                  onRemove={() => removeString(section, index)}
                />
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableList>

      <Button size="sm" onClick={() => addString(section)}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </FormSection>
  );
}
