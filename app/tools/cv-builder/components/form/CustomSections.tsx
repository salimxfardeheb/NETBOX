"use client";

import {
  FaAlignLeft,
  FaBriefcase,
  FaListUl,
  FaPlus,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import type { CVCustomKind, CVCustomSection, CVEntry } from "../../lib/types";
import { useCVStore } from "../../lib/store";
import { FormSection } from "./FormSection";
import { Field, TextArea, TextInput } from "./fields";

const KIND_LABELS: Record<CVCustomKind, string> = {
  list: "Liste à puces",
  entries: "Type expérience",
  text: "Texte libre",
};

function emptyEntry(): CVEntry {
  return { title: "", org: "", location: "", date: "", bullets: [] };
}

/** Éditeur d'un élément daté (comme une expérience) d'un bloc custom. */
function EntryEditor({
  entry,
  onChange,
  onRemove,
}: {
  entry: CVEntry;
  onChange: (patch: Partial<CVEntry>) => void;
  onRemove: () => void;
}) {
  const bullets = entry.bullets ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-glass-border bg-surface p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Intitulé" className="sm:col-span-2">
          <TextInput
            value={entry.title}
            placeholder="Titre de l'élément"
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field label="Organisation">
          <TextInput
            value={entry.org}
            placeholder="Organisme"
            onChange={(e) => onChange({ org: e.target.value })}
          />
        </Field>
        <Field label="Lieu">
          <TextInput
            value={entry.location ?? ""}
            placeholder="Ville"
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </Field>
        <Field label="Période" className="sm:col-span-2">
          <TextInput
            value={entry.date ?? ""}
            placeholder="2021 – 2024"
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-content-secondary">Détails (puces)</span>
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={bullet}
              placeholder="Détail…"
              onChange={(e) => {
                const next = [...bullets];
                next[i] = e.target.value;
                onChange({ bullets: next });
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 hover:text-red-400"
              aria-label="Supprimer la puce"
              onClick={() => onChange({ bullets: bullets.filter((_, j) => j !== i) })}
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex justify-between">
          <Button
            variant="add"
            size="sm"
            onClick={() => onChange({ bullets: [...bullets, ""] })}
          >
            <FaPlus className="h-3.5 w-3.5" />
            Ajouter une puce
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-red-400"
            onClick={onRemove}
          >
            <FaTrashAlt className="h-3.5 w-3.5" />
            Supprimer l&apos;élément
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomBlockEditor({ section }: { section: CVCustomSection }) {
  const updateCustomSection = useCVStore((s) => s.updateCustomSection);
  const removeCustomSection = useCVStore((s) => s.removeCustomSection);

  const update = (patch: Partial<Omit<CVCustomSection, "id">>) =>
    updateCustomSection(section.id, patch);

  return (
    <div className="space-y-3 rounded-xl border border-glass-border bg-surface p-4">
      <div className="flex items-end gap-2">
        <Field label={`Titre du bloc (${KIND_LABELS[section.kind]})`} className="flex-1">
          <TextInput
            value={section.title}
            placeholder="Certifications, Projets, Bénévolat…"
            onChange={(e) => update({ title: e.target.value })}
          />
        </Field>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 hover:text-red-400"
          aria-label="Supprimer le bloc"
          onClick={() => removeCustomSection(section.id)}
        >
          <FaTrashAlt className="h-4 w-4" />
        </Button>
      </div>

      {section.kind === "list" && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-content-secondary">Lignes</span>
          {(section.items ?? []).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <TextInput
                value={item}
                placeholder="Contenu de la ligne"
                onChange={(e) => {
                  const items = [...(section.items ?? [])];
                  items[index] = e.target.value;
                  update({ items });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:text-red-400"
                aria-label="Supprimer la ligne"
                onClick={() =>
                  update({ items: (section.items ?? []).filter((_, i) => i !== index) })
                }
              >
                <FaTimes className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="add"
            size="sm"
            onClick={() => update({ items: [...(section.items ?? []), ""] })}
          >
            <FaPlus className="h-3.5 w-3.5" />
            Ajouter une ligne
          </Button>
        </div>
      )}

      {section.kind === "text" && (
        <Field label="Texte">
          <TextArea
            value={section.text ?? ""}
            placeholder="Contenu du paragraphe…"
            onChange={(e) => update({ text: e.target.value })}
          />
        </Field>
      )}

      {section.kind === "entries" && (
        <div className="space-y-3">
          {(section.entries ?? []).map((entry, index) => (
            <EntryEditor
              key={index}
              entry={entry}
              onChange={(patch) => {
                const entries = [...(section.entries ?? [])];
                entries[index] = { ...entries[index], ...patch };
                update({ entries });
              }}
              onRemove={() =>
                update({ entries: (section.entries ?? []).filter((_, i) => i !== index) })
              }
            />
          ))}
          <Button
            variant="add"
            size="sm"
            onClick={() => update({ entries: [...(section.entries ?? []), emptyEntry()] })}
          >
            <FaPlus className="h-3.5 w-3.5" />
            Ajouter un élément
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Blocs libres définis par l'utilisateur, en trois formes :
 * liste à puces, éléments datés (comme une expérience) ou texte libre.
 * Chaque bloc apparaît dans le CV et se glisse dans la preview comme
 * n'importe quelle section intégrée.
 */
export function CustomSections() {
  const custom = useCVStore((s) => s.data.custom);
  const addCustomSection = useCVStore((s) => s.addCustomSection);

  return (
    <FormSection title="Blocs personnalisés">
      {custom.map((section) => (
        <CustomBlockEditor key={section.id} section={section} />
      ))}

      <div className="space-y-2">
        <span className="text-xs font-medium text-content-secondary">
          Ajouter un bloc :
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="add" size="sm" onClick={() => addCustomSection("list")}>
            <FaListUl className="h-4 w-4" />
            Liste à puces
          </Button>
          <Button variant="add" size="sm" onClick={() => addCustomSection("entries")}>
            <FaBriefcase className="h-4 w-4" />
            Type expérience
          </Button>
          <Button variant="add" size="sm" onClick={() => addCustomSection("text")}>
            <FaAlignLeft className="h-4 w-4" />
            Texte libre
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
