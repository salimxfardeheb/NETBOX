"use client";

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CVColumn, CVData, CVEntry, CVLayout, CVSectionId } from "../lib/types";
import { levelToPercent } from "../lib/levels";
import {
  MODELE4_COLORS,
  MODELE4_SECTION_TITLES,
  headerContactLines,
  personalLines,
} from "../templates/modele4";

/* Couleurs du modèle (mêmes valeurs que l'export .docx). */
const PHOTO_BG = `#${MODELE4_COLORS.photoBg}`;
const HEADER_BG = `#${MODELE4_COLORS.headerBg}`;
const ACCENT = `#${MODELE4_COLORS.accent}`;
const HEADING_BORDER = `#${MODELE4_COLORS.headingBorder}`;
const BAR_TRACK = `#${MODELE4_COLORS.barTrack}`;
const HEADER_TITLE = `#${MODELE4_COLORS.headerTitle}`;
const HEADER_CONTACT = `#${MODELE4_COLORS.headerContact}`;

/*
 * Tailles de texte en `em` : la base (1em) est fixée sur la feuille
 * à `10px × fontScale`, donc tout le document suit le réglage
 * "taille de l'écriture" — comme l'export Word.
 */

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mb-2 border-b pb-1 pt-1 text-[1.2em]"
      style={{ color: ACCENT, borderColor: HEADING_BORDER }}
    >
      {children}
    </h3>
  );
}

function EntryBlock({ entry }: { entry: CVEntry }) {
  const org = [entry.org, entry.location].filter((s) => s?.trim()).join(", ");
  const bullets = (entry.bullets ?? []).filter((b) => b.trim());

  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[1.1em] leading-snug">
        <span className="font-bold text-[#2B2B2B]">{entry.title}</span>
        {org && (
          <span className="text-[0.95em]" style={{ color: ACCENT }}>
            {"  "}
            {org}
          </span>
        )}
      </p>
      {entry.date?.trim() && (
        <p className="text-[0.95em] text-[#888888]">{entry.date}</p>
      )}
      {bullets.length > 0 && (
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[1em] text-[#555555]">
          {bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function hasEntries(entries: CVEntry[]): boolean {
  return entries.some((e) => e.title.trim() || e.org.trim());
}

/** Une section est masquée (preview + export) tant qu'elle est vide. */
function isSectionVisible(id: CVSectionId, data: CVData): boolean {
  switch (id) {
    case "contact":
      return personalLines(data).length > 0;
    case "summary":
      return Boolean(data.basics.summary?.trim());
    case "education":
    case "experience":
      return hasEntries(data[id]);
    case "languages":
      return data.languages.some((l) => l.name.trim());
    case "atouts":
    case "interests":
      return data[id].some((v) => v.trim());
    case "informatique":
      return data.informatique.some((c) => c.label.trim() || c.items.trim());
    default: {
      const section = data.custom.find((c) => c.id === id);
      if (!section) return false;
      if (section.title.trim()) return true;
      switch (section.kind) {
        case "entries":
          return hasEntries(section.entries ?? []);
        case "text":
          return Boolean(section.text?.trim());
        default:
          return (section.items ?? []).some((i) => i.trim());
      }
    }
  }
}

function SectionContent({ id, data }: { id: CVSectionId; data: CVData }) {
  const { basics } = data;

  switch (id) {
    case "contact":
      return (
        <section className="mb-3">
          <Heading>{MODELE4_SECTION_TITLES.contact}</Heading>
          <ul className="space-y-0.5 text-[1.05em] text-[#333333]">
            {personalLines(data).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      );

    case "summary":
      return (
        <p
          className={cn(
            "mb-3 whitespace-pre-line text-[1em] italic leading-relaxed text-[#555555]",
            basics.summaryJustify && "text-justify"
          )}
        >
          {basics.summary}
        </p>
      );

    case "education":
    case "experience":
      return (
        <section className="mb-3">
          <Heading>{MODELE4_SECTION_TITLES[id]}</Heading>
          {data[id].map((entry, i) => (
            <EntryBlock key={i} entry={entry} />
          ))}
        </section>
      );

    case "languages":
      return (
        <section className="mb-3">
          <Heading>{MODELE4_SECTION_TITLES.languages}</Heading>
          <ul className="space-y-2.5">
            {data.languages
              .filter((l) => l.name.trim())
              .map((lang, i) => (
                <li key={i} className="text-[1em]">
                  <p className="mb-1 text-[1.05em] font-bold text-[#333333]">
                    {lang.name}
                  </p>
                  <div
                    className="h-[5px] w-full"
                    style={{ backgroundColor: BAR_TRACK }}
                  >
                    <div
                      className="h-full transition-[width] duration-300"
                      style={{
                        width: `${levelToPercent(lang)}%`,
                        backgroundColor: ACCENT,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[0.95em] text-[#777777]">{lang.level}</p>
                </li>
              ))}
          </ul>
        </section>
      );

    case "atouts":
    case "interests":
      return (
        <section className="mb-3">
          <Heading>{MODELE4_SECTION_TITLES[id]}</Heading>
          <ul className="space-y-1 text-[1.05em] text-[#444444]">
            {data[id]
              .filter((v) => v.trim())
              .map((value, i) => (
                <li key={i}>{value}</li>
              ))}
          </ul>
        </section>
      );

    case "informatique":
      return (
        <section className="mb-3">
          <Heading>{MODELE4_SECTION_TITLES.informatique}</Heading>
          <ul className="space-y-1 text-[1em]">
            {data.informatique
              .filter((c) => c.label.trim() || c.items.trim())
              .map((category, i) => (
                <li key={i}>
                  {category.label && (
                    <span className="font-bold text-[#333333]">
                      {category.label} :{" "}
                    </span>
                  )}
                  <span className="text-[#444444]">{category.items}</span>
                </li>
              ))}
          </ul>
        </section>
      );

    default: {
      const section = data.custom.find((c) => c.id === id);
      if (!section) return null;

      let content: ReactNode;
      switch (section.kind) {
        case "entries":
          content = (section.entries ?? [])
            .filter((e) => e.title.trim() || e.org.trim())
            .map((entry, i) => <EntryBlock key={i} entry={entry} />);
          break;
        case "text":
          content = (
            <p className="whitespace-pre-line text-[1em] leading-relaxed text-[#444444]">
              {section.text}
            </p>
          );
          break;
        default:
          content = (
            <ul className="list-disc space-y-1 pl-4 text-[1.05em] text-[#444444]">
              {(section.items ?? [])
                .filter((i) => i.trim())
                .map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
            </ul>
          );
      }

      return (
        <section className="mb-3">
          <Heading>{section.title || "Bloc personnalisé"}</Heading>
          {content}
        </section>
      );
    }
  }
}

/** Section glissable — poignée visible au survol quand éditable. */
function SortableSection({
  id,
  editable,
  children,
}: {
  id: string;
  editable: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !editable });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative", isDragging && "z-10 opacity-50")}
    >
      {editable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Déplacer la section"
          className="absolute -left-4 top-0.5 cursor-grab rounded border border-slate-200 bg-white p-0.5 text-slate-400 opacity-0 shadow-sm transition-opacity hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      {children}
    </div>
  );
}

function PreviewColumn({
  column,
  ids,
  children,
  className,
}: {
  column: CVColumn;
  ids: string[];
  children: ReactNode;
  className?: string;
}) {
  const { setNodeRef } = useDroppable({ id: column });
  return (
    <div ref={setNodeRef} className={cn("min-h-[60px]", className)}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

/**
 * Rendu visuel du CV, fidèle à public/model_4.docx : bandeau d'en-tête
 * (photo / nom + titre / contact) puis deux colonnes blanches dont les
 * sections suivent `data.layout`. Les sections vides sont masquées.
 *
 * Si `onLayoutChange` est fourni, les sections deviennent glissables :
 * réordonnables dans une colonne et déplaçables d'une colonne à l'autre.
 */
export function CVPreview({
  data,
  onLayoutChange,
}: {
  data: CVData;
  onLayoutChange?: (layout: CVLayout) => void;
}) {
  const { basics, layout } = data;
  const editable = Boolean(onLayoutChange);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const firstName = basics.firstName.trim() || "Prénom";
  const lastName = basics.lastName.trim() || "NOM";
  const title = basics.title.trim() || "Intitulé du poste";

  const contactLines = headerContactLines(data);
  const photoPx = Math.round(105 * ((basics.photoSize ?? 100) / 100));
  const baseFontPx = ((data.fontScale ?? 100) / 100) * 10;

  const visibleLeft = layout.left.filter((id) => isSectionVisible(id, data));
  const visibleRight = layout.right.filter((id) => isSectionVisible(id, data));

  const columnOf = (id: string): CVColumn | null => {
    if (id === "left" || id === "right") return id;
    if (layout.left.includes(id)) return "left";
    if (layout.right.includes(id)) return "right";
    return null;
  };

  /* Passage d'une colonne à l'autre pendant le survol. */
  const handleDragOver = (event: DragOverEvent) => {
    if (!onLayoutChange || !event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    const from = columnOf(activeId);
    const to = columnOf(overId);
    if (!from || !to || from === to) return;

    const next: CVLayout = {
      left: layout.left.filter((id) => id !== activeId),
      right: layout.right.filter((id) => id !== activeId),
    };
    const target = next[to];
    const overIndex = target.indexOf(overId);
    if (overIndex === -1) target.push(activeId);
    else target.splice(overIndex, 0, activeId);
    onLayoutChange(next);
  };

  /* Réordonnancement au sein d'une même colonne. */
  const handleDragEnd = (event: DragEndEvent) => {
    if (!onLayoutChange || !event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    if (activeId === overId) return;
    const column = columnOf(activeId);
    if (!column || columnOf(overId) !== column) return;

    const list = layout[column];
    const from = list.indexOf(activeId);
    const to = list.indexOf(overId);
    if (from === -1 || to === -1) return;
    onLayoutChange({ ...layout, [column]: arrayMove(list, from, to) });
  };

  const document = (
    <div
      data-cv-sheet
      className="relative overflow-hidden rounded-xl bg-white shadow-2xl"
      // aspect-ratio garantit une feuille au moins au format A4 ;
      // le contenu qui déborde correspond à une 2ᵉ page à l'export.
      style={{ fontSize: `${baseFontPx}px`, aspectRatio: "210 / 297" }}
    >
      {/* Repère de fin de page 1 (masqué à l'export, preview uniquement) */}
      {editable && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 w-full"
          style={{ aspectRatio: "210 / 297" }}
        >
          <div className="absolute bottom-0 w-full border-b-2 border-dashed border-red-400/60" />
          <span className="absolute bottom-0.5 right-2 text-[9px] font-medium text-red-400/80">
            Fin de la page 1
          </span>
        </div>
      )}
      {/* Bandeau d'en-tête */}
      <div className="flex min-h-[150px]">
        <div
          className="flex w-[22%] shrink-0 items-center justify-center p-2"
          style={{ backgroundColor: PHOTO_BG }}
        >
          {basics.photo && (
            <img
              src={basics.photo}
              alt="Photo de profil"
              className="max-w-full object-cover"
              style={{ width: photoPx, height: photoPx }}
            />
          )}
        </div>
        <div
          className="flex w-[46%] flex-col justify-center px-4 py-3"
          style={{ backgroundColor: HEADER_BG }}
        >
          <p className="text-[2.5em] leading-tight text-white">
            {firstName}{" "}
            <span className="font-bold uppercase">{lastName}</span>
          </p>
          <p className="mt-1 text-[1.35em]" style={{ color: HEADER_TITLE }}>
            {title}
          </p>
        </div>
        <div
          className="flex w-[32%] flex-col justify-center px-4 py-3"
          style={{ backgroundColor: HEADER_BG }}
        >
          <ul className="space-y-1 text-[0.95em]" style={{ color: HEADER_CONTACT }}>
            {contactLines.map((line, i) => (
              <li key={i} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Corps : deux colonnes */}
      <div className="grid grid-cols-2 gap-x-6 px-5 py-4">
        <PreviewColumn column="left" ids={visibleLeft}>
          {visibleLeft.map((id) => (
            <SortableSection key={id} id={id} editable={editable}>
              <SectionContent id={id} data={data} />
            </SortableSection>
          ))}
        </PreviewColumn>
        <PreviewColumn column="right" ids={visibleRight}>
          {visibleRight.map((id) => (
            <SortableSection key={id} id={id} editable={editable}>
              <SectionContent id={id} data={data} />
            </SortableSection>
          ))}
        </PreviewColumn>
      </div>
    </div>
  );

  if (!editable) return document;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {document}
    </DndContext>
  );
}
