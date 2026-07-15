"use client";

import { useEffect, useRef, useState } from "react";
import {
  DOCUMENT_TYPE_LABELS,
  MODE_PAIEMENT_LABELS,
  STATUT_LABELS,
} from "@/lib/invoicing/config";
import type { InvoiceTotals } from "@/lib/invoicing/calculations";
import { montantEnLettres } from "@/lib/invoicing/montant-en-lettres";
import type { Invoice } from "@/lib/invoicing/types";
import { formatDate, formatMoney } from "../lib/format";
import type { ColonnesVisibles } from "../lib/store";

/*
 * Feuille A4 en points (1 px = 1 pt), même convention que le module CV :
 * le document est rendu à taille fixe puis mis à l'échelle du conteneur,
 * ce qui garantit un rendu identique à l'écran et dans le PDF exporté.
 */
const A4_W = 595;
const A4_H = 842;

/** Libellé d'accord de la phrase « Arrêté(e) … » selon le document. */
const ARRETE_LABELS: Record<Invoice["type"], string> = {
  FACTURE: "Arrêtée la présente facture à la somme de",
  PROFORMA: "Arrêtée la présente facture proforma à la somme de",
  DEVIS: "Arrêté le présent devis à la somme de",
  BON_LIVRAISON: "Arrêté le présent bon de livraison à la somme de",
};

function FiscalMention({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold">{label}&nbsp;:</span> {value}
    </span>
  );
}

/**
 * Document commercial rendu (aperçu conforme, base de l'export PDF).
 * Composant pur : tout vient des props, aucun accès au store — il est
 * aussi rendu hors écran par lib/export.ts.
 */
export function InvoicePreview({
  invoice,
  totals,
  afficherPrix = true,
  colonnes = { reference: true, unite: true, remise: true },
}: {
  invoice: Invoice;
  totals: InvoiceTotals;
  /** Bon de livraison : permet de masquer les prix (BL sans valorisation). */
  afficherPrix?: boolean;
  /** Colonnes optionnelles du tableau — les décochées n'apparaissent pas. */
  colonnes?: ColonnesVisibles;
}) {
  // Mise à l'échelle : la feuille (595 pt) est rendue telle quelle puis
  // réduite/agrandie pour remplir la colonne d'aperçu.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState<number | null>(null);
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) =>
      setWrapW(entries[0].contentRect.width)
    );
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  const k = wrapW ? wrapW / A4_W : 1;

  const { type, company, customer, devise } = invoice;
  const estBL = type === "BON_LIVRAISON";
  const avecPrix = !estBL || afficherPrix;
  // Devis : pas de mentions de paiement obligatoires.
  const avecPaiement = type === "FACTURE" || type === "PROFORMA";

  const [sheetH, setSheetH] = useState(A4_H);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sheetRef.current) return;
    const ro = new ResizeObserver((entries) =>
      setSheetH(Math.max(A4_H, entries[0].contentRect.height))
    );
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      <div className="relative" style={{ width: A4_W * k, height: sheetH * k }}>
        <div
          ref={sheetRef}
          data-invoice-sheet
          className="absolute left-0 top-0 origin-top-left rounded-lg bg-white text-black shadow-xl"
          style={{
            width: A4_W,
            minHeight: A4_H,
            transform: `scale(${k})`,
            fontSize: 10,
            lineHeight: 1.45,
            padding: 36,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          {/* ---- En-tête : vendeur / type + numéro + dates ---- */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[15px] font-bold uppercase">
                {company.raisonSociale}
              </div>
              <div className="whitespace-pre-line">{company.adresse}</div>
              <div>
                {[company.telephone && `Tél : ${company.telephone}`, company.email]
                  .filter(Boolean)
                  .join(" — ")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[16px] font-bold uppercase tracking-wide">
                {DOCUMENT_TYPE_LABELS[type]}
              </div>
              <div className="mt-1">
                <span className="font-semibold">N°&nbsp;:</span>{" "}
                {invoice.numeroApercu}
                {type === "FACTURE" && (
                  <span className="text-[8px] italic text-neutral-500">
                    {" "}
                    (aperçu)
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold">Date&nbsp;:</span>{" "}
                {formatDate(invoice.dateEmission)}
              </div>
              {invoice.dateEcheance && (
                <div>
                  <span className="font-semibold">Échéance&nbsp;:</span>{" "}
                  {formatDate(invoice.dateEcheance)}
                </div>
              )}
              {type === "DEVIS" && invoice.dateValidite && (
                <div>
                  <span className="font-semibold">Valable jusqu&apos;au&nbsp;:</span>{" "}
                  {formatDate(invoice.dateValidite)}
                </div>
              )}
            </div>
          </div>

          {/* ---- Mentions fiscales du vendeur (NIF/NIS/RC/AI) ---- */}
          <div
            className="mt-3 flex flex-wrap gap-x-4 gap-y-0.5 border-y border-neutral-300 py-1.5 text-[9px]"
          >
            <FiscalMention label="NIF" value={company.nif} />
            <FiscalMention label="NIS" value={company.nis} />
            <FiscalMention label="RC" value={company.rc} />
            <FiscalMention label="AI" value={company.articleImposition} />
            {company.assujettiTVA && (
              <FiscalMention label="N° TVA" value={company.numeroTVA} />
            )}
          </div>

          {/* ---- Bandeau proforma ---- */}
          {type === "PROFORMA" && (
            <div className="mt-3 border border-neutral-400 bg-neutral-100 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide">
              Facture proforma
            </div>
          )}

          {/* ---- Client — affiché seulement s'il y a quelque chose à écrire ---- */}
          {(customer.raisonSociale.trim() ||
            customer.adresse.trim() ||
            customer.nif?.trim() ||
            customer.telephone?.trim()) && (
            <div className="mt-4 flex justify-end">
              <div className="w-[46%] rounded border border-neutral-300 px-3 py-2">
                <div className="text-[8px] font-semibold uppercase tracking-wider text-neutral-500">
                  {estBL ? "Livré à" : "Client"}
                </div>
                <div className="font-bold">{customer.raisonSociale}</div>
                <div className="whitespace-pre-line">{customer.adresse}</div>
                {customer.nif && (
                  <div>
                    <span className="font-semibold">NIF&nbsp;:</span> {customer.nif}
                  </div>
                )}
                {customer.telephone && <div>Tél : {customer.telephone}</div>}
              </div>
            </div>
          )}

          {/* ---- Lignes ---- */}
          <table className="mt-4 w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-neutral-800 text-white">
                {colonnes.reference && (
                  <th className="border border-neutral-400 px-1.5 py-1 text-left">Réf.</th>
                )}
                <th className="border border-neutral-400 px-1.5 py-1 text-left">
                  Désignation
                </th>
                <th className="border border-neutral-400 px-1.5 py-1 text-right">Qté</th>
                {colonnes.unite && (
                  <th className="border border-neutral-400 px-1.5 py-1 text-left">Unité</th>
                )}
                {avecPrix && (
                  <>
                    <th className="border border-neutral-400 px-1.5 py-1 text-right">
                      PU HT
                    </th>
                    {colonnes.remise && (
                      <th className="border border-neutral-400 px-1.5 py-1 text-right">
                        Remise
                      </th>
                    )}
                    {/* Pas de colonne TVA : la TVA est une ligne des totaux. */}
                    <th className="border border-neutral-400 px-1.5 py-1 text-right">
                      Montant HT
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className={i % 2 ? "bg-neutral-50" : undefined}>
                  {colonnes.reference && (
                    <td className="border border-neutral-300 px-1.5 py-1">
                      {item.reference}
                    </td>
                  )}
                  <td className="border border-neutral-300 px-1.5 py-1">
                    {item.designation}
                  </td>
                  <td className="border border-neutral-300 px-1.5 py-1 text-right tabular-nums">
                    {item.quantite}
                  </td>
                  {colonnes.unite && (
                    <td className="border border-neutral-300 px-1.5 py-1">
                      {item.unite}
                    </td>
                  )}
                  {avecPrix && (
                    <>
                      <td className="border border-neutral-300 px-1.5 py-1 text-right tabular-nums">
                        {formatMoney(item.prixUnitaireHT, devise)}
                      </td>
                      {colonnes.remise && (
                        <td className="border border-neutral-300 px-1.5 py-1 text-right tabular-nums">
                          {item.montantRemise > 0
                            ? formatMoney(item.montantRemise, devise)
                            : ""}
                        </td>
                      )}
                      <td className="border border-neutral-300 px-1.5 py-1 text-right tabular-nums">
                        {formatMoney(item.montantHT, devise)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ---- Totaux (la TVA est une simple ligne, pas de tableau dédié) ---- */}
          {avecPrix && (
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="w-[46%]">
                {!company.assujettiTVA && (
                  <div className="mt-1 text-[9px] font-semibold italic">
                    TVA non applicable
                  </div>
                )}
              </div>

              {/* Cumuls. */}
              <table className="w-[46%] border-collapse text-[9.5px]">
                <tbody>
                  <TotalRow label="Total HT" value={formatMoney(totals.totalHT, devise)} />
                  {totals.totalRemises > 0 && (
                    <TotalRow
                      label="Total remises"
                      value={`− ${formatMoney(totals.totalRemises, devise)}`}
                    />
                  )}
                  {company.assujettiTVA && (
                    <TotalRow
                      label={
                        totals.tvaParTaux.length === 1
                          ? `TVA (${totals.tvaParTaux[0].taux} %)`
                          : "Total TVA"
                      }
                      value={formatMoney(totals.totalTVA, devise)}
                    />
                  )}
                  {totals.droitTimbre > 0 && (
                    <TotalRow
                      label="Droit de timbre (espèces)"
                      value={formatMoney(totals.droitTimbre, devise)}
                    />
                  )}
                  <TotalRow
                    label="Total TTC à payer"
                    value={formatMoney(totals.totalAPayer, devise)}
                    strong
                  />
                  {totals.acompte > 0 && (
                    <>
                      <TotalRow
                        label="Acompte versé"
                        value={`− ${formatMoney(totals.acompte, devise)}`}
                      />
                      <TotalRow
                        label="Reste à payer"
                        value={formatMoney(totals.resteAPayer, devise)}
                        strong
                      />
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- Montant en toutes lettres (mention obligatoire) ---- */}
          {avecPrix && (
            <p className="mt-4 text-[9.5px]">
              {ARRETE_LABELS[type]}&nbsp;:{" "}
              <span className="font-semibold italic">
                {capitalize(montantEnLettres(totals.totalAPayer, devise))}.
              </span>
            </p>
          )}

          {/* ---- Paiement (facture / proforma uniquement) ---- */}
          {avecPaiement && (
            <div className="mt-2 text-[9.5px]">
              <span className="font-semibold">Mode de paiement&nbsp;:</span>{" "}
              {MODE_PAIEMENT_LABELS[invoice.modePaiement]}
              {" — "}
              <span className="font-semibold">Statut&nbsp;:</span>{" "}
              {STATUT_LABELS[invoice.statut]}
            </div>
          )}

          {invoice.notes && (
            <div className="mt-3 whitespace-pre-line border-t border-neutral-300 pt-2 text-[9px] text-neutral-700">
              {invoice.notes}
            </div>
          )}

          {/* ---- Bon de livraison : zone de réception ---- */}
          {estBL && (
            <div className="mt-8 flex justify-between gap-6 text-[9.5px]">
              <div className="w-1/2">
                <div className="font-semibold">Reçu le&nbsp;: ____ / ____ / ________</div>
                <div className="mt-6 h-20 rounded border border-neutral-400 p-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-neutral-500">
                    Nom et signature du réceptionnaire
                  </span>
                </div>
              </div>
              <div className="w-1/2">
                <div className="font-semibold">Le livreur</div>
                <div className="mt-6 h-20 rounded border border-neutral-400 p-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-neutral-500">
                    Signature et cachet
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr className={strong ? "bg-neutral-800 text-white" : undefined}>
      <td
        className={`border border-neutral-300 px-2 py-1 ${
          strong ? "font-bold" : "font-medium"
        }`}
      >
        {label}
      </td>
      <td className="border border-neutral-300 px-2 py-1 text-right font-semibold tabular-nums">
        {value}
      </td>
    </tr>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
