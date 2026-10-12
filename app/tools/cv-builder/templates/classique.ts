import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LevelFormat,
  PageBorderDisplay,
  PageBorderOffsetFrom,
  PageBorderZOrder,
  Paragraph,
  Table,
  TableBorders,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { CVData, CVEntry } from "../lib/types";

/** Les deux versions du modèle classique. */
export type ClassiqueVariant = "homme" | "femme";

interface ClassiqueStyle {
  /** Titre « CURRICULUM VITAE » et titres de section. */
  accent: string;
  /** Police du corps (lignes à puces). */
  bodyFont: string;
  /** Pile de polices équivalente pour l'aperçu. */
  bodyFontCss: string;
}

/**
 * Style de chaque version — partagé avec l'aperçu pour garantir la
 * fidélité preview ↔ export. Homme : bleu ; Femme : rouge.
 */
export const CLASSIQUE_STYLES: Record<ClassiqueVariant, ClassiqueStyle> = {
  homme: {
    accent: "0070C0",
    bodyFont: "Times New Roman",
    bodyFontCss: '"Times New Roman", Times, serif',
  },
  femme: {
    accent: "C00000",
    bodyFont: "Calibri",
    bodyFontCss: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif',
  },
};

/** Police du titre et des titres de section (les deux versions). */
export const CLASSIQUE_HEADING_FONT = "Times New Roman";

/** Géométrie de la page, en points (l'aperçu rend l'A4 à 1 px = 1 pt). */
export const CLASSIQUE_PAGE = {
  /** Distance du cadre noir au bord de la feuille. */
  borderInset: 24,
  /** Épaisseur du cadre noir. */
  borderWidth: 3,
  marginX: 54,
  marginY: 46,
  /** Cadre photo (format photo d'identité), à photoSize = 100 %. */
  photoW: 92,
  photoH: 118,
} as const;

export const CLASSIQUE_TITLE = "CURRICULUM VITAE";

/* ---------- Contenu : structure commune à l'aperçu et à l'export ---------- */

/** Une ligne à puce : « libellé : valeur », plus d'éventuels sous-points. */
export interface ClassiqueLine {
  label?: string;
  value: string;
  details?: string[];
}

export interface ClassiqueSection {
  id: string;
  title: string;
  /** Paragraphe libre affiché avant les lignes (résumé, bloc texte). */
  text?: string;
  lines: ClassiqueLine[];
}

type Lang = NonNullable<CVData["language"]>;

const TITLES: Record<Lang, Record<string, string>> = {
  fr: {
    civil: "ÉTAT CIVIL",
    summary: "PROFIL",
    educationHomme: "NIVEAU & DIPLÔMES ACQUIS",
    educationFemme: "FORMATIONS ET DIPLÔMES ACQUIS",
    languages: "LANGUES MAÎTRISÉES",
    experience: "EXPÉRIENCE PROFESSIONNELLE",
    informatique: "INFORMATIQUE",
    interests: "CENTRES D'INTÉRÊT",
    atouts: "AUTRES",
    custom: "BLOC PERSONNALISÉ",
  },
  en: {
    civil: "PERSONAL DETAILS",
    summary: "PROFILE",
    educationHomme: "EDUCATION & QUALIFICATIONS",
    educationFemme: "EDUCATION & QUALIFICATIONS",
    languages: "LANGUAGES",
    experience: "WORK EXPERIENCE",
    informatique: "IT SKILLS",
    interests: "INTERESTS",
    atouts: "OTHER",
    custom: "CUSTOM SECTION",
  },
};

const LABELS: Record<Lang, Record<string, string>> = {
  fr: {
    lastName: "Nom",
    firstName: "Prénom",
    birthDate: "Date & lieu de naissance",
    phone: "Téléphone",
    email: "Email",
    address: "Adresse",
    maritalStatus: "Situation familiale",
    serviceNational: "Situation vis-à-vis du service national",
    nationality: "Nationalité",
    studyLevel: "Niveau d'étude",
    permis: "Permis",
  },
  en: {
    lastName: "Last name",
    firstName: "First name",
    birthDate: "Date & place of birth",
    phone: "Phone",
    email: "Email",
    address: "Address",
    maritalStatus: "Marital status",
    serviceNational: "National service status",
    nationality: "Nationality",
    studyLevel: "Education level",
    permis: "Driving licence",
  },
};

/** Séparateur libellé/valeur : espace avant les deux-points en français. */
export function classiqueSeparator(language: CVData["language"]): string {
  return language === "en" ? ": " : " : ";
}

function orgOf(entry: CVEntry): string {
  return [entry.org, entry.location].filter((s) => s?.trim()).join(", ");
}

function entryDetails(entry: CVEntry): string[] {
  return (entry.bullets ?? []).filter((b) => b.trim());
}

/** Diplôme : « intitulé — établissement (date) ». */
function educationLine(entry: CVEntry): ClassiqueLine {
  const org = orgOf(entry);
  const date = entry.date?.trim();
  const value =
    [entry.title.trim(), org].filter(Boolean).join(" — ") +
    (date ? ` (${date})` : "");
  return { value, details: entryDetails(entry) };
}

/** Expérience : « durée : poste — entreprise », comme dans le modèle. */
function experienceLine(entry: CVEntry): ClassiqueLine {
  return {
    label: entry.date?.trim() || undefined,
    value: [entry.title.trim(), orgOf(entry)].filter(Boolean).join(" — "),
    details: entryDetails(entry),
  };
}

function filled(entries: CVEntry[]): CVEntry[] {
  return entries.filter((e) => e.title.trim() || e.org.trim());
}

/**
 * Sections du modèle classique, dans l'ordre du modèle : état civil,
 * diplômes, langues, expérience, puis « Autres » (atouts) en dernier.
 * Les blocs absents du modèle (résumé, informatique, centres d'intérêt,
 * blocs personnalisés) ne s'affichent que s'ils sont remplis. Les
 * sections vides sont omises.
 */
export function classiqueSections(
  data: CVData,
  variant: ClassiqueVariant,
): ClassiqueSection[] {
  const { basics } = data;
  const lang: Lang = data.language === "en" ? "en" : "fr";
  const titles = TITLES[lang];
  const labels = LABELS[lang];
  const sections: ClassiqueSection[] = [];

  const labelled = (key: string, raw: string | undefined): ClassiqueLine[] => {
    const value = raw?.trim();
    return value ? [{ label: labels[key], value }] : [];
  };
  const plain = (values: (string | undefined)[]): ClassiqueLine[] =>
    values.filter((v) => v?.trim()).map((v) => ({ value: v!.trim() }));

  sections.push({
    id: "civil",
    title: titles.civil,
    lines: [
      ...labelled("lastName", basics.lastName),
      ...labelled("firstName", basics.firstName),
      ...labelled("birthDate", basics.birthDate),
      ...labelled("phone", basics.phone),
      ...labelled("email", basics.email),
      ...labelled("address", basics.address),
      ...labelled("maritalStatus", basics.maritalStatus),
      // Ligne propre à la version Homme du modèle.
      ...(variant === "homme"
        ? labelled("serviceNational", basics.serviceNational)
        : []),
      ...labelled("nationality", basics.nationality),
      ...plain([basics.linkedin, basics.website, basics.github]),
      ...plain(basics.personalCustom ?? []),
    ],
  });

  sections.push({
    id: "summary",
    title: titles.summary,
    text: basics.summary?.trim() || undefined,
    lines: [],
  });

  sections.push({
    id: "education",
    title:
      variant === "homme" ? titles.educationHomme : titles.educationFemme,
    lines: [
      ...labelled("studyLevel", basics.studyLevel),
      ...filled(data.education).map(educationLine),
      ...labelled("permis", basics.permis),
    ],
  });

  sections.push({
    id: "languages",
    title: titles.languages,
    lines: data.languages
      .filter((l) => l.name.trim())
      .map((l) => ({ label: l.name.trim(), value: l.level.trim() })),
  });

  sections.push({
    id: "experience",
    title: titles.experience,
    lines: filled(data.experience).map(experienceLine),
  });

  sections.push({
    id: "informatique",
    title: titles.informatique,
    lines: data.informatique
      .filter((c) => c.label.trim() || c.items.trim())
      .map((c) => ({
        label: c.label.trim() || undefined,
        value: c.items.trim(),
      })),
  });

  for (const custom of data.custom) {
    const section: ClassiqueSection = {
      id: custom.id,
      title: custom.title.trim().toLocaleUpperCase() || titles.custom,
      lines: [],
    };
    if (custom.kind === "entries") {
      section.lines = filled(custom.entries ?? []).map(experienceLine);
    } else if (custom.kind === "text") {
      section.text = custom.text?.trim() || undefined;
    } else {
      section.lines = plain(custom.items ?? []);
    }
    sections.push(section);
  }

  sections.push({
    id: "interests",
    title: titles.interests,
    lines: plain(data.interests),
  });

  sections.push({
    id: "atouts",
    title: titles.atouts,
    lines: plain(data.atouts),
  });

  return sections.filter((s) => s.lines.length > 0 || s.text);
}

/* ---------- Export .docx ---------- */

const NUMBERING = "classique";
/** ❖ du modèle : caractère « v » de Wingdings, comme les puces de Word. */
const BULLET_CHAR = "";

/** Résolution du recadrage de la photo (px par point affiché). */
const PHOTO_RASTER = 3;

/**
 * Recadre la photo au format du cadre (remplissage centré, comme
 * `object-cover` dans l'aperçu) : le .docx étire sinon l'image.
 */
async function cropPhoto(
  dataUrl: string,
  width: number,
  height: number,
): Promise<Uint8Array | null> {
  // Le recadrage utilise le DOM : côté serveur, on rend sans photo.
  if (typeof document === "undefined") return null;
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width * PHOTO_RASTER;
    canvas.height = height * PHOTO_RASTER;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const ratio = Math.max(
      canvas.width / img.naturalWidth,
      canvas.height / img.naturalHeight,
    );
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    const out = canvas.toDataURL("image/jpeg", 0.92);
    const binary = atob(out.slice(out.indexOf(",") + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    // Photo illisible : le CV s'exporte sans cadre photo.
    return null;
  }
}

/**
 * Modèle classique — page encadrée, titre « CURRICULUM VITAE », photo
 * en haut à droite puis sections sur une colonne, en lignes à puces ❖.
 * Deux versions : Homme (bleu, ligne « service national ») et Femme (rouge).
 */
export async function buildClassique(
  data: CVData,
  variant: ClassiqueVariant,
): Promise<Document> {
  const { basics } = data;
  const style = CLASSIQUE_STYLES[variant];
  const scale = (data.fontScale ?? 100) / 100;
  /** Taille en demi-points, mise à l'échelle de `data.fontScale`. */
  const sz = (halfPoints: number) => Math.round(halfPoints * scale);
  /** Espacement en twips, mis à l'échelle lui aussi. */
  const sp = (twips: number) => Math.round(twips * scale);
  const separator = classiqueSeparator(data.language);
  const P = CLASSIQUE_PAGE;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: sp(160) },
      children: [
        new TextRun({
          // Double espace : les deux mots sont nettement séparés.
          text: CLASSIQUE_TITLE.replace(" ", "  "),
          bold: true,
          italics: true,
          color: style.accent,
          font: CLASSIQUE_HEADING_FONT,
          size: sz(40),
          characterSpacing: 100,
        }),
      ],
    }),
  ];

  /* ---------- Photo : cadre en haut à droite ---------- */
  const photoW = Math.round(P.photoW * ((basics.photoSize ?? 100) / 100));
  const photoH = Math.round(P.photoH * ((basics.photoSize ?? 100) / 100));
  const photo = basics.photo
    ? await cropPhoto(basics.photo, photoW, photoH)
    : null;
  if (photo) {
    const textW = (595 - 2 * P.marginX) * 20; // largeur utile, en twips
    const cellW = (photoW + 8) * 20;
    const frame = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
    children.push(
      new Table({
        width: { size: textW, type: WidthType.DXA },
        columnWidths: [textW - cellW, cellW],
        borders: TableBorders.NONE,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: textW - cellW, type: WidthType.DXA },
                children: [new Paragraph("")],
              }),
              new TableCell({
                width: { size: cellW, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                borders: {
                  top: frame,
                  bottom: frame,
                  left: frame,
                  right: frame,
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [
                      new ImageRun({
                        type: "jpg",
                        data: photo,
                        transformation: { width: photoW, height: photoH },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  }

  /* ---------- Sections ---------- */
  for (const section of classiqueSections(data, variant)) {
    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: sp(240), after: sp(120) },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "404040",
            space: 1,
          },
        },
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            color: style.accent,
            font: CLASSIQUE_HEADING_FONT,
            size: sz(20),
            characterSpacing: 30,
          }),
        ],
      }),
    );

    if (section.text) {
      children.push(
        new Paragraph({
          indent: { left: 720 },
          alignment:
            section.id === "summary" && basics.summaryJustify
              ? AlignmentType.JUSTIFIED
              : undefined,
          spacing: { after: sp(80) },
          children: [
            new TextRun({ text: section.text, color: "1A1A1A", size: sz(22) }),
          ],
        }),
      );
    }

    for (const line of section.lines) {
      children.push(
        new Paragraph({
          numbering: { reference: NUMBERING, level: 0 },
          spacing: { after: sp(80) },
          children: [
            new TextRun({
              text: line.label
                ? `${line.label}${separator}${line.value}`
                : line.value,
              color: "1A1A1A",
              size: sz(22),
            }),
          ],
        }),
        ...(line.details ?? []).map(
          (detail) =>
            new Paragraph({
              numbering: { reference: NUMBERING, level: 1 },
              spacing: { after: sp(40) },
              children: [
                new TextRun({ text: detail, color: "404040", size: sz(20) }),
              ],
            }),
        ),
      );
    }
  }

  const pageBorder = {
    style: BorderStyle.SINGLE,
    size: P.borderWidth * 8, // huitièmes de point
    color: "000000",
    space: P.borderInset,
  };

  return new Document({
    styles: {
      default: {
        document: { run: { font: style.bodyFont, size: sz(22) } },
      },
    },
    numbering: {
      config: [
        {
          reference: NUMBERING,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: BULLET_CHAR,
              alignment: AlignmentType.LEFT,
              style: {
                run: { font: "Wingdings", size: sz(18) },
                paragraph: { indent: { left: 1080, hanging: 360 } },
              },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: "–",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 1440, hanging: 280 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: P.marginY * 20,
              bottom: P.marginY * 20,
              left: P.marginX * 20,
              right: P.marginX * 20,
            },
            borders: {
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                offsetFrom: PageBorderOffsetFrom.PAGE,
                zOrder: PageBorderZOrder.FRONT,
              },
              pageBorderTop: pageBorder,
              pageBorderRight: pageBorder,
              pageBorderBottom: pageBorder,
              pageBorderLeft: pageBorder,
            },
          },
        },
        children,
      },
    ],
  });
}
