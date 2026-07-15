"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { computeItem } from "@/lib/invoicing/calculations";
import { TVA_RATES, UNITES } from "@/lib/invoicing/config";
import type { RemiseType } from "@/lib/invoicing/types";
import { formatMoney } from "../lib/format";
import { useFactureStore } from "../lib/store";
import { Field, NumberInput, Select, TextInput } from "./fields";

/** Tableau des lignes — calculs recalculés en direct à chaque frappe. */
export function ItemsSection() {
  const items = useFactureStore((s) => s.items);
  const devise = useFactureStore((s) => s.devise);
  const addItem = useFactureStore((s) => s.addItem);
  const updateItem = useFactureStore((s) => s.updateItem);
  const removeItem = useFactureStore((s) => s.removeItem);
  const notes = useFactureStore((s) => s.notes);
  const patch = useFactureStore((s) => s.patch);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lignes</CardTitle>
        <Button variant="add" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </Button>
      </CardHeader>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-content-secondary">
            Aucune ligne — ajoutez-en une pour commencer.
          </p>
        )}

        {items.map((item, i) => {
          const computed = computeItem(item);
          return (
            <div
              key={i}
              className="rounded-xl border border-glass-border bg-surface p-3"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Field label={`Désignation (ligne ${i + 1})`} className="col-span-2 sm:col-span-3">
                  <TextInput
                    value={item.designation}
                    onChange={(e) => updateItem(i, { designation: e.target.value })}
                    placeholder="Produit ou prestation…"
                  />
                </Field>
                <Field label="Référence">
                  <TextInput
                    value={item.reference ?? ""}
                    onChange={(e) => updateItem(i, { reference: e.target.value })}
                  />
                </Field>

                <Field label="Quantité">
                  <NumberInput
                    min={0}
                    step="any"
                    value={item.quantite}
                    onValueChange={(v) => updateItem(i, { quantite: v })}
                  />
                </Field>
                <Field label="Unité">
                  <Select
                    value={item.unite}
                    onChange={(e) => updateItem(i, { unite: e.target.value })}
                  >
                    {UNITES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="PU HT">
                  <NumberInput
                    min={0}
                    step="any"
                    value={item.prixUnitaireHT}
                    onValueChange={(v) => updateItem(i, { prixUnitaireHT: v })}
                  />
                </Field>
                <Field label="TVA">
                  <Select
                    value={item.taux}
                    onChange={(e) => updateItem(i, { taux: Number(e.target.value) })}
                  >
                    {TVA_RATES.map((rate) => (
                      <option key={rate.taux} value={rate.taux}>
                        {rate.libelle}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Type de remise">
                  <Select
                    value={item.remiseType}
                    onChange={(e) =>
                      updateItem(i, { remiseType: e.target.value as RemiseType })
                    }
                  >
                    <option value="POURCENT">Pourcentage (%)</option>
                    <option value="MONTANT">Montant fixe</option>
                  </Select>
                </Field>
                <Field
                  label={item.remiseType === "POURCENT" ? "Remise (%)" : "Remise (montant)"}
                >
                  <NumberInput
                    min={0}
                    step="any"
                    value={item.remiseValeur}
                    onValueChange={(v) => updateItem(i, { remiseValeur: v })}
                  />
                </Field>

                {/* Montants calculés de la ligne + suppression. */}
                <div className="col-span-2 flex items-end justify-between gap-2">
                  <div className="pb-1 text-xs text-content-secondary">
                    <span className="mr-3">
                      HT&nbsp;:{" "}
                      <span className="font-semibold text-content-primary tabular-nums">
                        {formatMoney(computed.montantHT, devise)}
                      </span>
                    </span>
                    <span>
                      TTC&nbsp;:{" "}
                      <span className="font-semibold text-content-primary tabular-nums">
                        {formatMoney(computed.montantTTC, devise)}
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer la ligne ${i + 1}`}
                    onClick={() => removeItem(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Field label="Notes (affichées en bas du document)" className="mt-4">
        <TextInput
          value={notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Conditions, garanties, références de commande…"
        />
      </Field>
    </Card>
  );
}
