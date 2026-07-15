"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  DOCUMENT_TYPE_LABELS,
  MODE_PAIEMENT_LABELS,
  STATUT_LABELS,
} from "@/lib/invoicing/config";
import type {
  DocumentType,
  ModePaiement,
  StatutPaiement,
} from "@/lib/invoicing/types";
import { useFactureStore } from "../lib/store";
import { Field, Select, TextInput } from "./fields";

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[];

/** Sélecteur de type + métadonnées du document (numéro, dates, paiement). */
export function DocumentSection() {
  const s = useFactureStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document</CardTitle>
      </CardHeader>

      {/* Sélecteur de type — segments. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {DOCUMENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => s.setType(type)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
              s.type === type
                ? "glass-active text-content-primary"
                : "border-glass-border bg-field text-content-secondary hover:text-content-primary"
            )}
          >
            {DOCUMENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Numéro (aperçu, provisoire)">
          <TextInput
            value={s.numeroApercu}
            onChange={(e) => s.patch({ numeroApercu: e.target.value })}
            placeholder="2026-0001"
          />
        </Field>
        <Field label="Date d'émission">
          <TextInput
            type="date"
            value={s.dateEmission}
            onChange={(e) => s.patch({ dateEmission: e.target.value })}
          />
        </Field>
        {s.type === "DEVIS" ? (
          <Field label="Valable jusqu'au">
            <TextInput
              type="date"
              value={s.dateValidite}
              onChange={(e) => s.patch({ dateValidite: e.target.value })}
            />
          </Field>
        ) : (
          <Field label="Date d'échéance (optionnel)">
            <TextInput
              type="date"
              value={s.dateEcheance}
              onChange={(e) => s.patch({ dateEcheance: e.target.value })}
            />
          </Field>
        )}

        {s.type !== "BON_LIVRAISON" && (
          <>
            <Field label="Mode de paiement">
              <Select
                value={s.modePaiement}
                onChange={(e) =>
                  s.patch({ modePaiement: e.target.value as ModePaiement })
                }
              >
                {(
                  Object.keys(MODE_PAIEMENT_LABELS) as ModePaiement[]
                ).map((mode) => (
                  <option key={mode} value={mode}>
                    {MODE_PAIEMENT_LABELS[mode]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Statut">
              <Select
                value={s.statut}
                onChange={(e) =>
                  s.patch({ statut: e.target.value as StatutPaiement })
                }
              >
                {(Object.keys(STATUT_LABELS) as StatutPaiement[]).map((st) => (
                  <option key={st} value={st}>
                    {STATUT_LABELS[st]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Devise">
              <TextInput
                value={s.devise}
                onChange={(e) => s.patch({ devise: e.target.value.toUpperCase() })}
                maxLength={3}
              />
            </Field>
          </>
        )}

        {s.type === "BON_LIVRAISON" && (
          <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm text-content-secondary sm:col-span-2">
            <input
              type="checkbox"
              checked={s.afficherPrixBL}
              onChange={(e) => s.patch({ afficherPrixBL: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Afficher les prix sur le bon de livraison
          </label>
        )}
      </div>

      {s.type === "PROFORMA" && (
        <p className="mt-3 text-xs text-content-secondary">
          La mention « Facture proforma — sans valeur fiscale » sera affichée
          sur le document.
        </p>
      )}
    </Card>
  );
}
