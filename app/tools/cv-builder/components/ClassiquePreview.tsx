"use client";

/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";
import type { CVData } from "../lib/types";
import {
  CLASSIQUE_HEADING_FONT,
  CLASSIQUE_PAGE,
  CLASSIQUE_STYLES,
  CLASSIQUE_TITLE,
  type ClassiqueVariant,
  classiqueSections,
  classiqueSeparator,
} from "../templates/classique";
import { A4Sheet } from "./A4Sheet";

const P = CLASSIQUE_PAGE;
const HEADING_FONT = `"${CLASSIQUE_HEADING_FONT}", Times, serif`;

/**
 * Rendu visuel du modèle classique (Homme / Femme) : page encadrée,
 * titre, photo en haut à droite puis sections sur une colonne. Le
 * contenu vient de `classiqueSections`, comme l'export .docx.
 */
export function ClassiquePreview({
  data,
  variant,
}: {
  data: CVData;
  variant: ClassiqueVariant;
}) {
  const { basics } = data;
  const style = CLASSIQUE_STYLES[variant];
  const accent = `#${style.accent}`;
  const separator = classiqueSeparator(data.language);
  const photoScale = (basics.photoSize ?? 100) / 100;

  return (
    <A4Sheet
      fontPx={((data.fontScale ?? 100) / 100) * 10}
      style={{ fontFamily: style.bodyFontCss }}
    >
      {/* Cadre noir de la page */}
      <div
        aria-hidden
        className="pointer-events-none absolute border-solid border-black"
        style={{ inset: P.borderInset, borderWidth: P.borderWidth }}
      />

      <div style={{ padding: `${P.marginY}px ${P.marginX}px` }}>
        <h2
          className="text-center text-[2em] font-bold italic leading-tight"
          style={{
            color: accent,
            fontFamily: HEADING_FONT,
            letterSpacing: "0.25em",
            wordSpacing: "0.5em",
          }}
        >
          {CLASSIQUE_TITLE}
        </h2>

        {basics.photo && (
          <div className="mt-2 flex justify-end">
            <div className="border border-black p-[3px]">
              <img
                src={basics.photo}
                alt="Photo de profil"
                className="block object-cover"
                style={{
                  width: Math.round(P.photoW * photoScale),
                  height: Math.round(P.photoH * photoScale),
                }}
              />
            </div>
          </div>
        )}

        {classiqueSections(data, variant).map((section) => (
          <section key={section.id}>
            <h3
              className="mb-[0.6em] mt-[1.2em] border-b border-[#404040] pb-px text-[1em] font-bold"
              style={{
                color: accent,
                fontFamily: HEADING_FONT,
                letterSpacing: "0.15em",
              }}
            >
              {section.title}
            </h3>
            {section.text && (
              <p
                className={cn(
                  "mb-[0.4em] whitespace-pre-line pl-9 text-[1.1em] leading-snug text-[#1A1A1A]",
                  section.id === "summary" &&
                    basics.summaryJustify &&
                    "text-justify",
                )}
              >
                {section.text}
              </p>
            )}
            <ul className="space-y-[0.4em] pl-9 text-[1.1em] leading-snug text-[#1A1A1A]">
              {section.lines.map((line, i) => (
                <li key={i} className="flex gap-[0.7em]">
                  <span aria-hidden className="shrink-0 text-[0.8em]">
                    ❖
                  </span>
                  <div className="min-w-0 break-words">
                    {line.label
                      ? `${line.label}${separator}${line.value}`
                      : line.value}
                    {line.details && line.details.length > 0 && (
                      <ul className="mt-[0.2em] space-y-[0.15em] text-[0.9em] text-[#404040]">
                        {line.details.map((detail, j) => (
                          <li key={j} className="flex gap-[0.5em]">
                            <span aria-hidden className="shrink-0">
                              –
                            </span>
                            <span className="min-w-0">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </A4Sheet>
  );
}
