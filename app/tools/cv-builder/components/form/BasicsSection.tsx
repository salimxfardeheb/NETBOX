"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, type ChangeEvent } from "react";
import {
  FaAlignJustify,
  FaAlignLeft,
  FaRegFileAlt,
  FaRegImage,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useCVStore } from "../../lib/store";
import { FormSection } from "./FormSection";
import { ItemControls } from "./ItemControls";
import { SortableList, SortableRow } from "./SortableList";
import { Field, TextArea, TextInput } from "./fields";

export function BasicsSection() {
  const basics = useCVStore((s) => s.data.basics);
  const language = useCVStore((s) => s.data.language ?? "fr");
  const setLanguage = useCVStore((s) => s.setLanguage);
  const setBasics = useCVStore((s) => s.setBasics);
  const setPhoto = useCVStore((s) => s.setPhoto);
  const addPersonalCustom = useCVStore((s) => s.addPersonalCustom);
  const updatePersonalCustom = useCVStore((s) => s.updatePersonalCustom);
  const removePersonalCustom = useCVStore((s) => s.removePersonalCustom);
  const reorderPersonalCustom = useCVStore((s) => s.reorderPersonalCustom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const personalCustom = basics.personalCustom ?? [];
  const personalCustomIds = personalCustom.map((_, i) => `personal-${i}`);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
    // Permet de re-sélectionner le même fichier après un retrait.
    event.target.value = "";
  };

  return (
    <FormSection title="Informations">
      {/* Photo */}
      <div className="flex items-center gap-4">
        {basics.photo ? (
          <img
            src={basics.photo}
            alt="Aperçu de la photo"
            className="h-16 w-16 rounded-full border border-glass-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-glass-border text-content-secondary">
            <FaRegImage className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            {basics.photo ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          {basics.photo && (
            <Button variant="ghost" size="sm" onClick={() => setPhoto(null)}>
              <FaTimes className="h-3.5 w-3.5" />
              Retirer la photo
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Taille de la photo (preview + export Word) */}
      {basics.photo && (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-content-secondary">
            Taille de la photo — {basics.photoSize ?? 100} %
          </span>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={basics.photoSize ?? 100}
            onChange={(e) => setBasics({ photoSize: Number(e.target.value) })}
            className="w-full accent-accent"
          />
        </label>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={language === "en" ? "CV language" : "Langue du CV"}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
            className="w-full rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm text-content-primary"
          >
            <option value="fr">{language === "en" ? "French" : "Français"}</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="Prénom">
          <TextInput
            value={basics.firstName}
            placeholder="Prénom"
            onChange={(e) => setBasics({ firstName: e.target.value })}
          />
        </Field>
        <Field label="Nom">
          <TextInput
            value={basics.lastName}
            placeholder="Nom"
            onChange={(e) => setBasics({ lastName: e.target.value })}
          />
        </Field>
        <Field label="Intitulé du poste" className="sm:col-span-2">
          <TextInput
            value={basics.title}
            placeholder="Ex. Développeur full-stack"
            onChange={(e) => setBasics({ title: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={basics.email ?? ""}
            placeholder="prenom.nom@mail.com"
            onChange={(e) => setBasics({ email: e.target.value })}
          />
        </Field>
        <Field label="Téléphone">
          <TextInput
            type="tel"
            value={basics.phone ?? ""}
            placeholder="06 12 34 56 78"
            onChange={(e) => setBasics({ phone: e.target.value })}
          />
        </Field>
        <Field label="Adresse" className="sm:col-span-2">
          <TextInput
            value={basics.address ?? ""}
            placeholder="Ville, pays"
            onChange={(e) => setBasics({ address: e.target.value })}
          />
        </Field>
        <Field label="Date de naissance">
          <TextInput
            value={basics.birthDate ?? ""}
            placeholder="01/01/1990"
            onChange={(e) => setBasics({ birthDate: e.target.value })}
          />
        </Field>
        <Field label="Permis">
          <TextInput
            value={basics.permis ?? ""}
            placeholder="B"
            onChange={(e) => setBasics({ permis: e.target.value })}
          />
        </Field>
        <Field label="Nationalité">
          <TextInput
            value={basics.nationality ?? ""}
            placeholder="Algérienne"
            onChange={(e) => setBasics({ nationality: e.target.value })}
          />
        </Field>
        <Field label="Situation familiale">
          <TextInput
            value={basics.maritalStatus ?? ""}
            placeholder="Célibataire"
            onChange={(e) => setBasics({ maritalStatus: e.target.value })}
          />
        </Field>
        <Field label="LinkedIn">
          <TextInput
            value={basics.linkedin ?? ""}
            placeholder="linkedin.com/in/prenom-nom"
            onChange={(e) => setBasics({ linkedin: e.target.value })}
          />
        </Field>
        <Field label="Site web">
          <TextInput
            value={basics.website ?? ""}
            placeholder="monsite.com"
            onChange={(e) => setBasics({ website: e.target.value })}
          />
        </Field>
        <Field label="GitHub">
          <TextInput
            value={basics.github ?? ""}
            placeholder="github.com/pseudo"
            onChange={(e) => setBasics({ github: e.target.value })}
          />
        </Field>

        {/* Infos personnelles libres — chacune avec une icône générique. */}
        <div className="space-y-2 sm:col-span-2">
          <span className="text-xs font-medium text-content-secondary">
            Autres infos personnelles
          </span>
          <SortableList
            ids={personalCustomIds}
            onReorder={(from, to) => reorderPersonalCustom(from, to)}
          >
            <div className="space-y-2">
              {personalCustom.map((value, index) => (
                <SortableRow
                  key={personalCustomIds[index]}
                  id={personalCustomIds[index]}
                >
                  <div className="flex items-center gap-2">
                    <TextInput
                      value={value}
                      placeholder="Ex. Disponibilité : immédiate"
                      onChange={(e) =>
                        updatePersonalCustom(index, e.target.value)
                      }
                    />
                    <ItemControls
                      onRemove={() => removePersonalCustom(index)}
                    />
                  </div>
                </SortableRow>
              ))}
            </div>
          </SortableList>
          <Button
            variant="add"
            size="sm"
            className="w-full"
            onClick={addPersonalCustom}
          >
            <FaPlus className="h-4 w-4" />
            Ajouter une info
          </Button>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-content-secondary">
              <FaRegFileAlt className="h-3.5 w-3.5" />
              Résumé / profil
            </span>
            {/* Alignement du résumé (preview + export Word). */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(!basics.summaryJustify && "glass-active")}
                aria-label="Aligner à gauche"
                title="Aligné à gauche"
                onClick={() => setBasics({ summaryJustify: false })}
              >
                <FaAlignLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(basics.summaryJustify && "glass-active")}
                aria-label="Justifier"
                title="Justifié"
                onClick={() => setBasics({ summaryJustify: true })}
              >
                <FaAlignJustify className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <TextArea
            rows={8}
            value={basics.summary ?? ""}
            placeholder="Quelques lignes qui résument votre parcours…"
            onChange={(e) => setBasics({ summary: e.target.value })}
          />
        </div>
      </div>
    </FormSection>
  );
}
