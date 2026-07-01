"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LEVEL_OPTIONS } from "../../lib/levels";
import { useCVStore } from "../../lib/store";
import { FormSection } from "./FormSection";
import { ItemControls } from "./ItemControls";
import { SortableList, SortableRow } from "./SortableList";
import { Field, Select, TextInput } from "./fields";

export function LanguagesSection() {
  const languages = useCVStore((s) => s.data.languages);
  const addItem = useCVStore((s) => s.addItem);
  const updateItem = useCVStore((s) => s.updateItem);
  const removeItem = useCVStore((s) => s.removeItem);
  const moveItem = useCVStore((s) => s.moveItem);
  const reorderItem = useCVStore((s) => s.reorderItem);

  const ids = languages.map((_, i) => `lang-${i}`);

  return (
    <FormSection title="Langues">
      <SortableList ids={ids} onReorder={(from, to) => reorderItem("languages", from, to)}>
        <div className="space-y-3">
          {languages.map((language, index) => (
            <SortableRow key={ids[index]} id={ids[index]}>
              <div className="flex items-end gap-2 rounded-xl border border-glass-border bg-white/[0.03] p-3">
                <Field label="Langue" className="flex-1">
                  <TextInput
                    value={language.name}
                    placeholder="Anglais"
                    onChange={(e) =>
                      updateItem("languages", index, { name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Niveau" className="w-44">
                  <Select
                    value={language.level}
                    onChange={(e) =>
                      updateItem("languages", index, { level: e.target.value })
                    }
                  >
                    {LEVEL_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="pb-1">
                  <ItemControls
                    index={index}
                    count={languages.length}
                    onMove={(dir) => moveItem("languages", index, dir)}
                    onRemove={() => removeItem("languages", index)}
                  />
                </div>
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableList>

      <Button size="sm" onClick={() => addItem("languages")}>
        <Plus className="h-4 w-4" />
        Ajouter une langue
      </Button>
    </FormSection>
  );
}
