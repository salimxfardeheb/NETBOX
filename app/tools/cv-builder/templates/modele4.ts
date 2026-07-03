import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  LineRuleType,
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
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Cake,
  Car,
  Flag,
  Github,
  Globe,
  Heart,
  Info,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
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

/** Nature d'une info de contact du bandeau d'en-tête (haut). */
export type ContactType = "email" | "phone";

/** Nature d'une info du bloc « Informations personnelles » (corps). */
export type PersonalType =
  | "birthDate"
  | "nationality"
  | "address"
  | "maritalStatus"
  | "permis"
  | "website"
  | "linkedin"
  | "github"
  | "custom";

/** Clé d'icône : toute info porteuse d'une icône (en-tête ou corps). */
export type IconKey = ContactType | PersonalType;

/**
 * Icône (composant lucide) associée à chaque info — source unique
 * partagée par la preview (rendu JSX) et l'export (rastérisation PNG).
 */
export const CV_ICONS: Record<IconKey, LucideIcon> = {
  email: Mail,
  phone: Phone,
  birthDate: Cake,
  nationality: Flag,
  address: MapPin,
  maritalStatus: Heart,
  permis: Car,
  website: Globe,
  linkedin: Linkedin,
  github: Github,
  custom: Info,
};

/** Une info porteuse d'une icône : sa nature + sa valeur affichée. */
export interface ContactItem {
  type: ContactType;
  value: string;
}
export interface PersonalItem {
  type: PersonalType;
  value: string;
}

/**
 * Bandeau d'en-tête : uniquement email + téléphone (mis en avant).
 * Le reste (adresse, liens, etc.) descend dans le bloc du corps.
 */
export function headerContactItems(data: CVData): ContactItem[] {
  const { basics } = data;
  const source: [ContactType, string | undefined][] = [
    ["email", basics.email],
    ["phone", basics.phone],
  ];
  return source
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([type, value]) => ({ type, value: value!.trim() }));
}

/**
 * Bloc « Informations personnelles » du corps : date de naissance,
 * nationalité, adresse, situation familiale, permis, liens (site, LinkedIn,
 * GitHub) puis les lignes libres saisies par l'utilisateur.
 */
export function personalItems(data: CVData): PersonalItem[] {
  const { basics } = data;
  const items: PersonalItem[] = [];
  const add = (
    type: PersonalType,
    raw: string | undefined,
    format?: (v: string) => string
  ) => {
    const v = raw?.trim();
    if (v) items.push({ type, value: format ? format(v) : v });
  };
  add("birthDate", basics.birthDate, (v) => `Né(e) le ${v}`);
  add("nationality", basics.nationality, (v) => `Nationalité : ${v}`);
  add("address", basics.address);
  add("maritalStatus", basics.maritalStatus);
  add("permis", basics.permis, (v) => `Permis ${v}`);
  add("website", basics.website);
  add("linkedin", basics.linkedin);
  add("github", basics.github);
  for (const line of basics.personalCustom ?? []) add("custom", line);
  return items;
}

/* ---------- Icônes : rastérisation SVG (lucide) → PNG monochrome ---------- */

/** Couleur des icônes du bandeau (sur fond bleu nuit). */
const HEADER_ICON_COLOR = `#${C.headerContact}`;
/** Couleur des icônes du corps (sur fond blanc), assortie aux titres. */
const BODY_ICON_COLOR = `#${C.accent}`;
/** Résolution des PNG d'icônes — net quelle que soit la taille d'affichage. */
const ICON_RASTER_PX = 96;

/** Dimensions d'affichage de la barre de niveau (image PNG arrondie).
 *  Largeur ≈ 60 % de la colonne, hauteur fine. */
const BAR_W = 210;
const BAR_H = 6;

/** PNG d'icônes préparés pour la construction en cours (clé `type|couleur`). */
let iconPngs = new Map<string, Uint8Array>();
/** PNG des barres de niveau, clé = pourcentage ×100 arrondi. */
let barPngs = new Map<number, Uint8Array>();

function barKey(percent: number): number {
  return Math.round(percent * 100);
}

function iconCacheKey(key: IconKey, colorHex: string): string {
  return `${key}|${colorHex}`;
}

/** Taille d'affichage d'une icône (px) alignée sur une taille de texte. */
function iconPx(halfPoints: number): number {
  return Math.max(8, Math.round(((halfPoints * 2) / 3) * scale));
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Rastérise une icône lucide en PNG transparent (traits colorés). */
async function rasterizeIcon(key: IconKey, colorHex: string): Promise<Uint8Array> {
  const svg = renderToStaticMarkup(
    createElement(CV_ICONS[key], {
      color: colorHex,
      size: ICON_RASTER_PX,
      strokeWidth: 2,
    })
  );
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = ICON_RASTER_PX;
    canvas.height = ICON_RASTER_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Contexte canvas 2D indisponible");
    ctx.drawImage(img, 0, 0, ICON_RASTER_PX, ICON_RASTER_PX);
    return dataUrlToBytes(canvas.toDataURL("image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rastérise une barre de niveau arrondie (piste + remplissage) en PNG. */
async function rasterizeBar(percent: number): Promise<Uint8Array> {
  const RES = 3; // suréchantillonnage pour des bords nets
  const w = BAR_W * RES;
  const h = BAR_H * RES;
  const r = h / 2; // extrémités entièrement arrondies
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Contexte canvas 2D indisponible");
  const roundRect = (width: number, color: string) => {
    ctx.beginPath();
    ctx.roundRect(0, 0, width, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  };
  roundRect(w, `#${C.barTrack}`); // piste (100 %)
  // `percent` est sur une échelle 0–100 → ramener en fraction pour la largeur.
  const frac = Math.min(1, Math.max(0, percent / 100));
  if (frac > 0) roundRect(Math.max(h, Math.round(w * frac)), `#${C.accent}`);
  return dataUrlToBytes(canvas.toDataURL("image/png"));
}

/** Prépare (une fois par export) les images (icônes + barres) du CV. */
async function loadAssets(data: CVData): Promise<void> {
  iconPngs = new Map();
  barPngs = new Map();
  // La rastérisation utilise le DOM : côté serveur, on rend sans images.
  if (typeof document === "undefined") return;

  const icons = new Map<string, [IconKey, string]>();
  for (const it of headerContactItems(data)) {
    icons.set(iconCacheKey(it.type, HEADER_ICON_COLOR), [it.type, HEADER_ICON_COLOR]);
  }
  for (const it of personalItems(data)) {
    icons.set(iconCacheKey(it.type, BODY_ICON_COLOR), [it.type, BODY_ICON_COLOR]);
  }

  const bars = new Map<number, number>(); // clé -> pourcentage
  for (const lang of data.languages) {
    if (lang.name.trim()) {
      const p = levelToPercent(lang);
      bars.set(barKey(p), p);
    }
  }

  await Promise.all([
    ...[...icons.values()].map(async ([key, color]) => {
      try {
        iconPngs.set(iconCacheKey(key, color), await rasterizeIcon(key, color));
      } catch {
        // Icône indisponible : la ligne s'affichera en texte seul.
      }
    }),
    ...[...bars.entries()].map(async ([key, percent]) => {
      try {
        barPngs.set(key, await rasterizeBar(percent));
      } catch {
        // Barre indisponible : ligne de langue sans barre.
      }
    }),
  ]);
}

/** ImageRun de l'icône préparée, ou null si absente (fallback texte seul). */
function iconRun(key: IconKey, colorHex: string, px: number): ImageRun | null {
  const data = iconPngs.get(iconCacheKey(key, colorHex));
  if (!data) return null;
  return new ImageRun({
    type: "png",
    data,
    transformation: { width: px, height: px },
  });
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

/** Barre de niveau : image PNG arrondie (piste + remplissage). */
function levelBar(percent: number): Paragraph {
  const png = barPngs.get(barKey(percent));
  if (!png) return new Paragraph({ spacing: { before: 0, after: 0 } });
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [
      new ImageRun({
        type: "png",
        data: png,
        transformation: { width: BAR_W, height: BAR_H },
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
      const items = personalItems(data);
      if (items.length === 0) return [];
      const px = iconPx(21);
      return [
        heading(MODELE4_SECTION_TITLES.contact),
        ...items.map((item, i) => {
          const icon = iconRun(item.type, BODY_ICON_COLOR, px);
          return new Paragraph({
            spacing: { after: sp(i === items.length - 1 ? 140 : 40) },
            children: [
              ...(icon ? [icon, new TextRun({ text: "  " })] : []),
              new TextRun({ text: item.value, color: "333333", size: sz(21) }),
            ],
          });
        }),
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
export async function buildModele4(data: CVData): Promise<Document> {
  const { basics } = data;
  scale = (data.fontScale ?? 100) / 100;
  // Prépare les images (icônes + barres) avant de construire le document.
  await loadAssets(data);

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

  const contactItems = headerContactItems(data);

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
              contactItems.length > 0
                ? contactItems.map((item) => {
                    // Email + téléphone : texte agrandi, précédé de leur icône.
                    const icon = iconRun(item.type, HEADER_ICON_COLOR, iconPx(22));
                    return new Paragraph({
                      spacing: { after: sp(80) },
                      children: [
                        ...(icon ? [icon, new TextRun({ text: "  " })] : []),
                        new TextRun({
                          text: item.value,
                          color: C.headerContact,
                          size: sz(22),
                        }),
                      ],
                    });
                  })
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
        children: [
          header,
          new Paragraph({ spacing: { after: sp(40) } }),
          body,
          // Word exige un paragraphe après un tableau ; on le réduit à ~0
          // (hauteur exacte 1 pt, texte vide) pour éviter une page blanche
          // superflue quand le corps remplit presque la page.
          new Paragraph({
            spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT },
            children: [new TextRun({ text: "", size: 2 })],
          }),
        ],
      },
    ],
  });
}
