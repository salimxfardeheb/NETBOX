import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Paragraph,
  ShadingType,
  Table,
  TableBorders,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { CVData, CVEntry, CVSectionId } from "../lib/types";
import { levelToPercent } from "../lib/levels";

/**
 * Couleurs du modèle 4 (extraites de public/model_4.docx) —
 * partagées avec CVPreview pour garantir la fidélité preview ↔ export.
 */
export const MODELE4_COLORS = {
  /** Cellule photo de l'en-tête. */
  photoBg: "2B4763",
  /** Bandeau d'en-tête (nom + contact). */
  headerBg: "2B4763",
  /** Titres de section, organisation, barres de langue. */
  accent: "2B7CB8",
  /** Soulignement des titres de section. */
  headingBorder: "CFDAE6",
  /** Piste (fond) des barres de langue. */
  barTrack: "E4E9EF",
  /** Intitulé du poste dans l'en-tête. */
  headerTitle: "C8D6E5",
  /** Lignes de contact dans l'en-tête. */
  headerContact: "DBE4EE",
} as const;

const C = MODELE4_COLORS;
const WHITE = "FFFFFF";

type Block = Paragraph | Table;

/**
 * Échelle d'écriture appliquée à toutes les tailles du document.
 * Fixée au début de buildModele4 (construction synchrone, mono-thread).
 */
let scale = 1;

/** Taille en demi-points, mise à l'échelle de `data.fontScale`. */
function sz(halfPoints: number): number {
  return Math.round(halfPoints * scale);
}

/**
 * Espacement en twips, mis à l'échelle lui aussi : réduire l'écriture
 * compacte tout le document, ce qui permet de tenir sur une page.
 */
function sp(twips: number): number {
  return Math.round(twips * scale);
}

/** Titres des sections intégrées (repris tels quels du modèle). */
export const MODELE4_SECTION_TITLES: Record<string, string> = {
  contact: "Informations personnelles",
  education: "Diplômes et Formations",
  experience: "Expériences professionnelles",
  languages: "Langues",
  atouts: "Atouts",
  interests: "Centres d'intérêt",
  informatique: "Informatique",
};

/** Lignes du bloc "Informations personnelles" du corps du CV. */
export function personalLines(data: CVData): string[] {
  const { basics } = data;
  return [
    basics.birthDate?.trim() && `Né(e) le ${basics.birthDate}`,
    basics.nationality?.trim() && `Nationalité : ${basics.nationality}`,
    basics.maritalStatus?.trim() && basics.maritalStatus,
    basics.permis?.trim() && `Permis ${basics.permis}`,
  ].filter((l): l is string => Boolean(l));
}

/** Lignes de contact du bandeau d'en-tête. */
export function headerContactLines(data: CVData): string[] {
  const { basics } = data;
  return [basics.email, basics.address, basics.phone, basics.linkedin, basics.website].filter(
    (l): l is string => Boolean(l?.trim())
  );
}

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: sp(80), after: sp(120) },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: C.headingBorder, space: 0 },
    },
    children: [new TextRun({ text, color: C.accent, size: sz(24) })],
  });
}

function plainLine(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: sp(40) },
    children: [new TextRun({ text, color: "444444", size: sz(21) })],
  });
}

function entryBlocks(entry: CVEntry): Block[] {
  const blocks: Block[] = [];
  const org = [entry.org, entry.location].filter((s) => s?.trim()).join(", ");

  blocks.push(
    new Paragraph({
      spacing: { after: sp(20) },
      children: [
        new TextRun({ text: `${entry.title}  `, bold: true, color: "2B2B2B", size: sz(22) }),
        ...(org ? [new TextRun({ text: org, color: C.accent, size: sz(21) })] : []),
      ],
    })
  );

  if (entry.date?.trim()) {
    blocks.push(
      new Paragraph({
        spacing: { after: sp(40) },
        children: [new TextRun({ text: entry.date, color: "888888", size: sz(19) })],
      })
    );
  }

  for (const bullet of entry.bullets ?? []) {
    if (!bullet.trim()) continue;
    blocks.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: sp(40) },
        children: [new TextRun({ text: bullet, color: "555555", size: sz(20) })],
      })
    );
  }

  // Respiration entre deux blocs, comme dans le modèle.
  blocks.push(new Paragraph({ spacing: { after: sp(80) } }));
  return blocks;
}

/** Barre de niveau : tableau d'une ligne (partie remplie + piste). */
function levelBar(percent: number): Table {
  const filled = Math.round(percent * 50); // largeur en "pct" (5000 = 100 %)
  const cells: TableCell[] = [];

  if (filled > 0) {
    cells.push(
      new TableCell({
        width: { size: filled, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: C.accent },
        children: [new Paragraph("")],
      })
    );
  }
  if (filled < 5000) {
    cells.push(
      new TableCell({
        width: { size: 5000 - filled, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: C.barTrack },
        children: [new Paragraph("")],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        height: { value: sp(90), rule: HeightRule.EXACT },
        children: cells,
      }),
    ],
  });
}

function dataUrlToImage(
  dataUrl: string
): { data: Uint8Array; type: "png" | "jpg" | "gif" | "bmp" } | null {
  const match = /^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const type = match[1] === "jpeg" || match[1] === "jpg" ? "jpg" : (match[1] as "png" | "gif" | "bmp");
  const binary = atob(match[2]);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return { data, type };
}

function hasEntries(entries: CVEntry[]): boolean {
  return entries.some((e) => e.title.trim() || e.org.trim());
}

/** Rend une section du corps ; tableau vide si rien à afficher. */
function renderSection(id: CVSectionId, data: CVData): Block[] {
  const { basics } = data;

  switch (id) {
    case "contact": {
      const lines = personalLines(data);
      if (lines.length === 0) return [];
      return [
        heading(MODELE4_SECTION_TITLES.contact),
        ...lines.map(
          (text, i) =>
            new Paragraph({
              spacing: { after: sp(i === lines.length - 1 ? 140 : 40) },
              children: [new TextRun({ text, color: "333333", size: sz(21) })],
            })
        ),
      ];
    }

    case "summary": {
      if (!basics.summary?.trim()) return [];
      // Dans le modèle, le résumé suit le bloc Contact sans titre propre.
      return [
        new Paragraph({
          spacing: { after: sp(180) },
          alignment: basics.summaryJustify ? AlignmentType.JUSTIFIED : undefined,
          children: [
            new TextRun({ text: basics.summary, italics: true, color: "555555", size: sz(20) }),
          ],
        }),
      ];
    }

    case "education":
    case "experience": {
      const entries = data[id];
      if (!hasEntries(entries)) return [];
      return [
        heading(MODELE4_SECTION_TITLES[id]),
        ...entries.flatMap((entry) => entryBlocks(entry)),
      ];
    }

    case "languages": {
      const languages = data.languages.filter((l) => l.name.trim());
      if (languages.length === 0) return [];
      const blocks: Block[] = [heading(MODELE4_SECTION_TITLES.languages)];
      for (const lang of languages) {
        blocks.push(
          new Paragraph({
            spacing: { after: sp(40) },
            children: [
              new TextRun({ text: lang.name, bold: true, color: "333333", size: sz(21) }),
            ],
          }),
          levelBar(levelToPercent(lang)),
          new Paragraph({
            spacing: { before: sp(30), after: sp(140) },
            children: [new TextRun({ text: lang.level, color: "777777", size: sz(19) })],
          })
        );
      }
      return blocks;
    }

    case "atouts":
    case "interests": {
      const values = data[id].filter((v) => v.trim());
      if (values.length === 0) return [];
      return [heading(MODELE4_SECTION_TITLES[id]), ...values.map(plainLine)];
    }

    case "informatique": {
      const categories = data.informatique.filter((c) => c.label.trim() || c.items.trim());
      if (categories.length === 0) return [];
      return [
        heading(MODELE4_SECTION_TITLES.informatique),
        ...categories.map(
          (category) =>
            new Paragraph({
              spacing: { after: sp(60) },
              children: [
                new TextRun({
                  text: category.label ? `${category.label} : ` : "",
                  bold: true,
                  color: "333333",
                  size: sz(20),
                }),
                new TextRun({ text: category.items, color: "444444", size: sz(20) }),
              ],
            })
        ),
      ];
    }

    default: {
      // Bloc personnalisé (`custom:<id>`) — contenu selon son type.
      const section = data.custom.find((c) => c.id === id);
      if (!section) return [];

      let content: Block[] = [];
      switch (section.kind) {
        case "entries": {
          const entries = (section.entries ?? []).filter((e) => e.title.trim() || e.org.trim());
          content = entries.flatMap((entry) => entryBlocks(entry));
          break;
        }
        case "text": {
          if (section.text?.trim()) {
            content = [
              new Paragraph({
                spacing: { after: sp(120) },
                children: [new TextRun({ text: section.text, color: "444444", size: sz(20) })],
              }),
            ];
          }
          break;
        }
        default:
          // Liste à puces : lignes avec puce, contrairement aux Atouts.
          content = (section.items ?? [])
            .filter((i) => i.trim())
            .map(
              (text) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: sp(40) },
                  children: [new TextRun({ text, color: "444444", size: sz(21) })],
                })
            );
      }

      if (!section.title.trim() && content.length === 0) return [];
      return [heading(section.title || "Bloc personnalisé"), ...content];
    }
  }
}

function noBordersCell(options: ConstructorParameters<typeof TableCell>[0]): TableCell {
  return new TableCell(options);
}

/**
 * Modèle 4 — réplique de public/model_4.docx : bandeau d'en-tête
 * (photo / nom + contact sur fond bleu nuit) puis deux colonnes
 * blanches égales dont les sections suivent `data.layout`.
 */
export function buildModele4(data: CVData): Document {
  const { basics } = data;
  scale = (data.fontScale ?? 100) / 100;

  /* ---------- Bandeau d'en-tête ---------- */
  const photoPx = Math.round(115 * ((basics.photoSize ?? 100) / 100));
  const photoChildren: Paragraph[] = [];
  if (basics.photo) {
    const image = dataUrlToImage(basics.photo);
    if (image) {
      photoChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: image.type,
              data: image.data,
              transformation: { width: photoPx, height: photoPx },
            }),
          ],
        })
      );
    }
  }
  if (photoChildren.length === 0) {
    photoChildren.push(new Paragraph({ alignment: AlignmentType.CENTER }));
  }

  const contactLines = headerContactLines(data);

  const header = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        height: { value: sp(2474), rule: HeightRule.ATLEAST },
        children: [
          noBordersCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: C.photoBg },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 150, bottom: 150, left: 120, right: 120 },
            children: photoChildren,
          }),
          noBordersCell({
            width: { size: 46, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: C.headerBg },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 220, bottom: 220, left: 200, right: 80 },
            children: [
              new Paragraph({
                spacing: { after: sp(40) },
                children: [
                  new TextRun({ text: `${basics.firstName} `, color: WHITE, size: sz(52) }),
                  new TextRun({
                    text: basics.lastName,
                    bold: true,
                    allCaps: true,
                    color: WHITE,
                    size: sz(52),
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: basics.title, color: C.headerTitle, size: sz(28) }),
                ],
              }),
            ],
          }),
          noBordersCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: C.headerBg },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 220, bottom: 220, left: 80, right: 200 },
            children:
              contactLines.length > 0
                ? contactLines.map(
                    (text) =>
                      new Paragraph({
                        spacing: { after: sp(40) },
                        children: [
                          new TextRun({ text, color: C.headerContact, size: sz(19) }),
                        ],
                      })
                  )
                : [new Paragraph("")],
          }),
        ],
      }),
    ],
  });

  /* ---------- Corps : deux colonnes suivant le layout ---------- */
  const leftBlocks = data.layout.left.flatMap((id) => renderSection(id, data));
  const rightBlocks = data.layout.right.flatMap((id) => renderSection(id, data));

  const body = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          noBordersCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 220, bottom: 120, left: 120, right: 240 },
            children: leftBlocks.length > 0 ? leftBlocks : [new Paragraph("")],
          }),
          noBordersCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 220, bottom: 120, left: 240, right: 120 },
            children: rightBlocks.length > 0 ? rightBlocks : [new Paragraph("")],
          }),
        ],
      }),
    ],
  });

  return new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: sz(22) } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 340, bottom: 340, left: 340, right: 340 },
          },
        },
        children: [header, new Paragraph({ spacing: { after: sp(40) } }), body],
      },
    ],
  });
}
