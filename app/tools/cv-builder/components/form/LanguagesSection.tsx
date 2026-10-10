"use client";

import { FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { getLevelOptions } from "../../lib/levels";
import { useCVStore } from "../../lib/store";
import { FormSection } from "./FormSection";
import { ItemControls } from "./ItemControls";
import { SortableList, SortableRow } from "./SortableList";
import { Field, Select, TextInput } from "./fields";

export function LanguagesSection() {
  const languageMode = useCVStore((s) => s.data.language ?? "fr");
  const languages = useCVStore((s) => s.data.languages);
  const addItem = useCVStore((s) => s.addItem);
  const updateItem = useCVStore((s) => s.updateItem);
  const removeItem = useCVStore((s) => s.removeItem);
  const reorderItem = useCVStore((s) => s.reorderItem);

  const ids = languages.map((_, i) => `lang-${i}`);
  const isEnglish = languageMode === "en";
  const levelOptions = getLevelOptions(languageMode);

  return (
    <FormSection title={isEnglish ? "Languages" : "Langues"}>
      <SortableList
        ids={ids}
        onReorder={(from, to) => reorderItem("languages", from, to)}
      >
        <div className="space-y-3">
          {languages.map((language, index) => (
            <SortableRow key={ids[index]} id={ids[index]}>
              <div className="flex items-end gap-2 rounded-xl border border-glass-border bg-surface p-3">
                <Field
                  label={isEnglish ? "Language" : "Langue"}
                  className="flex-1"
                >
                  <TextInput
                    value={language.name}
                    placeholder={isEnglish ? "English" : "Anglais"}
                    onChange={(e) =>
                      updateItem("languages", index, { name: e.target.value })
                    }
                  />
                </Field>
                <Field label={isEnglish ? "Level" : "Niveau"} className="w-44">
                  <Select
                    value={language.level}
                    onChange={(e) =>
                      updateItem("languages", index, { level: e.target.value })
                    }
                  >
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="pb-1">
                  <ItemControls
                    onRemove={() => removeItem("languages", index)}
                  />
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
        onClick={() => addItem("languages")}
      >
        <FaPlus className="h-4 w-4" />
        {isEnglish ? "Add a language" : "Ajouter une langue"}
      </Button>
    </FormSection>
  );
}
