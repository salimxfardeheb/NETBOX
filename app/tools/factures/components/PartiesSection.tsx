"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useFactureStore } from "../lib/store";
import { Field, TextArea, TextInput } from "./fields";

/** Bloc vendeur : identité + mentions fiscales obligatoires (NIF/NIS/RC/AI). */
export function CompanySection() {
  const company = useFactureStore((s) => s.company);
  const patchCompany = useFactureStore((s) => s.patchCompany);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendeur</CardTitle>
        <CardDescription>
          Mentions fiscales obligatoires sur les factures (NIF, NIS, RC, AI).
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Raison sociale" className="col-span-2">
          <TextInput
            value={company.raisonSociale}
            onChange={(e) => patchCompany({ raisonSociale: e.target.value })}
          />
        </Field>
        <Field label="Adresse" className="col-span-2">
          <TextArea
            rows={2}
            value={company.adresse}
            onChange={(e) => patchCompany({ adresse: e.target.value })}
          />
        </Field>
        <Field label="Téléphone">
          <TextInput
            value={company.telephone}
            onChange={(e) => patchCompany({ telephone: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={company.email}
            onChange={(e) => patchCompany({ email: e.target.value })}
          />
        </Field>
        <Field label="NIF">
          <TextInput
            value={company.nif}
            onChange={(e) => patchCompany({ nif: e.target.value })}
          />
        </Field>
        <Field label="NIS">
          <TextInput
            value={company.nis}
            onChange={(e) => patchCompany({ nis: e.target.value })}
          />
        </Field>
        <Field label="Registre de commerce (RC)">
          <TextInput
            value={company.rc}
            onChange={(e) => patchCompany({ rc: e.target.value })}
          />
        </Field>
        <Field label="Article d'imposition (AI)">
          <TextInput
            value={company.articleImposition}
            onChange={(e) => patchCompany({ articleImposition: e.target.value })}
          />
        </Field>

        <label className="flex items-center gap-2 self-end pb-2 text-sm text-content-secondary">
          <input
            type="checkbox"
            checked={company.assujettiTVA}
            onChange={(e) => patchCompany({ assujettiTVA: e.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Assujetti à la TVA
        </label>
        {company.assujettiTVA ? (
          <Field label="N° TVA (optionnel)">
            <TextInput
              value={company.numeroTVA ?? ""}
              onChange={(e) => patchCompany({ numeroTVA: e.target.value })}
            />
          </Field>
        ) : (
          <p className="self-end pb-2 text-xs text-content-secondary">
            « TVA non applicable » sera affiché sur le document.
          </p>
        )}
      </div>
    </Card>
  );
}

/** Bloc client : saisie manuelle (bibliothèque persistée = étape 2). */
export function CustomerSection() {
  const customer = useFactureStore((s) => s.customer);
  const patchCustomer = useFactureStore((s) => s.patchCustomer);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client</CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Raison sociale / nom" className="col-span-2">
          <TextInput
            value={customer.raisonSociale}
            onChange={(e) => patchCustomer({ raisonSociale: e.target.value })}
          />
        </Field>
        <Field label="Adresse" className="col-span-2">
          <TextArea
            rows={2}
            value={customer.adresse}
            onChange={(e) => patchCustomer({ adresse: e.target.value })}
          />
        </Field>
        <Field label="NIF (optionnel)">
          <TextInput
            value={customer.nif ?? ""}
            onChange={(e) => patchCustomer({ nif: e.target.value })}
          />
        </Field>
        <Field label="Téléphone (optionnel)">
          <TextInput
            value={customer.telephone ?? ""}
            onChange={(e) => patchCustomer({ telephone: e.target.value })}
          />
        </Field>
        <Field label="Email (optionnel)" className="col-span-2">
          <TextInput
            type="email"
            value={customer.email ?? ""}
            onChange={(e) => patchCustomer({ email: e.target.value })}
          />
        </Field>
      </div>
    </Card>
  );
}
