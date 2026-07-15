"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { isStampDutyApplicable } from "@/lib/invoicing/calculations";
import { montantEnLettres } from "@/lib/invoicing/montant-en-lettres";
import { formatMoney } from "../lib/format";
import { buildTotals, useFactureStore } from "../lib/store";
import { Field, NumberInput } from "./fields";

function Row({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 text-sm",
        strong && "text-base font-semibold text-content-primary",
        muted && "text-content-secondary"
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** Panneau de totaux LIVE : HT, remises, TVA par taux, timbre, TTC, acompte. */
export function TotalsPanel() {
  const state = useFactureStore();
  const totals = buildTotals(state);
  const { devise } = state;
  const timbrePossible = isStampDutyApplicable(state.modePaiement);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Totaux</CardTitle>
      </CardHeader>

      <div className="space-y-1.5">
        <Row label="Total HT" value={formatMoney(totals.totalHT, devise)} />
        {totals.totalRemises > 0 && (
          <Row
            label="Total remises"
            value={`− ${formatMoney(totals.totalRemises, devise)}`}
            muted
          />
        )}
        {totals.tvaParTaux.map((entry) => (
          <Row
            key={entry.taux}
            label={`TVA ${entry.taux} % (base ${formatMoney(entry.base, devise)})`}
            value={formatMoney(entry.montant, devise)}
            muted
          />
        ))}
        <Row label="Total TVA" value={formatMoney(totals.totalTVA, devise)} />
        <Row label="Total TTC" value={formatMoney(totals.totalTTC, devise)} />
        {timbrePossible && (
          <Row
            label="Droit de timbre (paiement en espèces)"
            value={formatMoney(totals.droitTimbre, devise)}
          />
        )}

        <div className="my-2 border-t border-glass-border" />
        <Row
          label="Total à payer"
          value={formatMoney(totals.totalAPayer, devise)}
          strong
        />

        <Field label="Acompte versé" className="pt-2">
          <NumberInput
            min={0}
            step="any"
            value={state.acompte}
            onValueChange={(v) => state.patch({ acompte: v })}
          />
        </Field>
        {totals.acompte > 0 && (
          <Row
            label="Reste à payer"
            value={formatMoney(totals.resteAPayer, devise)}
            strong
          />
        )}

        <p className="pt-2 text-xs italic text-content-secondary">
          Soit&nbsp;: {montantEnLettres(totals.totalAPayer, devise)}.
        </p>
      </div>
    </Card>
  );
}
