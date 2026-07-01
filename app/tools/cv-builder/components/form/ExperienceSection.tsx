"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCVStore } from "../../lib/store";
import { FormSection } from "./FormSection";
import { ItemControls } from "./ItemControls";
import { SortableList, SortableRow } from "./SortableList";
import { Field, TextInput } from "./fields";

/**
 * Section générique pour les blocs datés — utilisée pour les
 * expériences ET les formations (même forme). Les blocs se réordonnent
 * par glisser-déposer (poignée) ou avec les flèches.
 */
export function ExperienceSection({
  section,
  title,
  addLabel,
  titlePlaceholder,
  orgPlaceholder,
}: {
  section: "experience" | "education";
  title: string;
  addLabel: string;
  titlePlaceholder: string;
  orgPlaceholder: string;
}) {
  const entries = useCVStore((s) => s.data[section]);
  const addItem = useCVStore((s) => s.addItem);
  const updateItem = useCVStore((s) => s.updateItem);
  const removeItem = useCVStore((s) => s.removeItem);
  const moveItem = useCVStore((s) => s.moveItem);
  const reorderItem = useCVStore((s) => s.reorderItem);

  const ids = entries.map((_, i) => `${section}-${i}`);

  return (
    <FormSection title={title}>
      <SortableList ids={ids} onReorder={(from, to) => reorderItem(section, from, to)}>
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const bullets = entry.bullets ?? [];
            const setBullets = (next: string[]) =>
              updateItem(section, index, { bullets: next });

            return (
              <SortableRow key={ids[index]} id={ids[index]}>
                <div className="space-y-3 rounded-xl border border-glass-border bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                      #{index + 1}
                    </span>
                    <ItemControls
                      index={index}
                      count={entries.length}
                      onMove={(dir) => moveItem(section, index, dir)}
                      onRemove={() => removeItem(section, index)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Intitulé" className="sm:col-span-2">
                      <TextInput
                        value={entry.title}
                        placeholder={titlePlaceholder}
                        onChange={(e) =>
                          updateItem(section, index, { title: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Organisation">
                      <TextInput
                        value={entry.org}
                        placeholder={orgPlaceholder}
                        onChange={(e) =>
                          updateItem(section, index, { org: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Lieu">
                      <TextInput
                        value={entry.location ?? ""}
                        placeholder="Ville"
                        onChange={(e) =>
                          updateItem(section, index, { location: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Période" className="sm:col-span-2">
                      <TextInput
                        value={entry.date ?? ""}
                        placeholder="2021 – 2024"
                        onChange={(e) =>
                          updateItem(section, index, { date: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-content-secondary">
                      Détails (puces)
                    </span>
                    {bullets.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex items-center gap-2">
                        <TextInput
                          value={bullet}
                          placeholder="Réalisation, mission, résultat…"
                          onChange={(e) => {
                            const next = [...bullets];
                            next[bulletIndex] = e.target.value;
                            setBullets(next);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0 hover:text-red-400"
                          aria-label="Supprimer la puce"
                          onClick={() =>
                            setBullets(bullets.filter((_, i) => i !== bulletIndex))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBullets([...bullets, ""])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une puce
                    </Button>
                  </div>
                </div>
              </SortableRow>
            );
          })}
        </div>
      </SortableList>

      <Button size="sm" onClick={() => addItem(section)}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </FormSection>
  );
}
