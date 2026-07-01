"use client";

import { BasicsSection } from "./BasicsSection";
import { CustomSections } from "./CustomSections";
import { ExperienceSection } from "./ExperienceSection";
import { InformatiqueSection } from "./InformatiqueSection";
import { LanguagesSection } from "./LanguagesSection";
import { StringListSection } from "./StringListSection";

/** Assemble toutes les sections d'édition du CV. */
export function CVForm() {
  return (
    <div className="space-y-4">
      <BasicsSection />
      <ExperienceSection
        section="experience"
        title="Expériences"
        addLabel="Ajouter une expérience"
        titlePlaceholder="Développeur web"
        orgPlaceholder="Entreprise"
      />
      <ExperienceSection
        section="education"
        title="Formations"
        addLabel="Ajouter une formation"
        titlePlaceholder="Master Informatique"
        orgPlaceholder="École / université"
      />
      <LanguagesSection />
      <StringListSection
        section="atouts"
        title="Atouts"
        addLabel="Ajouter un atout"
        placeholder="Rigueur, autonomie…"
      />
      <StringListSection
        section="interests"
        title="Centres d'intérêt"
        addLabel="Ajouter un centre d'intérêt"
        placeholder="Photographie, randonnée…"
      />
      <InformatiqueSection />
      <CustomSections />
    </div>
  );
}
