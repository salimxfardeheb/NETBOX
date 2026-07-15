"use client";

import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, FileDown, FilePlus2, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTopbarSlot } from "@/lib/topbar-slot";
import { CloudControls } from "./components/CloudControls";
import { DocumentSection } from "./components/DocumentSection";
import { ItemsSection } from "./components/ItemsSection";
import { InvoicePreview } from "./components/InvoicePreview";
import { CompanySection, CustomerSection } from "./components/PartiesSection";
import { TotalsPanel } from "./components/TotalsPanel";
import { exportInvoicePdf, printInvoice } from "./lib/export";
import { buildInvoice, buildTotals, useFactureStore } from "./lib/store";
import { invoiceWarnings } from "./lib/validation";

/**
 * « Nouveau document » (liste / sidebar) pointe sur ?new=1 : on
 * réinitialise l'éditeur puis on nettoie l'URL. Isolé sous <Suspense>
 * car useSearchParams l'exige au build.
 */
function NewDocHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      useFactureStore.getState().reset();
      router.replace("/tools/factures");
    }
  }, [searchParams, router]);

  return null;
}

/**
 * Module Factures — rédaction et rendu de documents commerciaux
 * (facture, proforma, devis, bon de livraison), avec sauvegarde en
 * ligne des données JSON (Supabase, aucun fichier en Storage).
 */
export default function FacturesPage() {
  const topbarSlot = useTopbarSlot((s) => s.el);
  const state = useFactureStore();
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);

  // Le rendu dépend d'état client (dates du jour…) : on attend le montage
  // pour éviter tout mismatch d'hydratation.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="glass flex h-40 items-center justify-center rounded-glass text-sm text-content-secondary">
        Chargement de l&apos;éditeur…
      </div>
    );
  }

  const invoice = buildInvoice(state);
  const totals = buildTotals(state);
  // Rappels informatifs uniquement — rien n'est bloquant, tous les champs
  // sont facultatifs.
  const warnings = invoiceWarnings(invoice);
  const afficherPrix = state.type !== "BON_LIVRAISON" || state.afficherPrixBL;

  const handleNew = () => {
    if (
      window.confirm(
        "Nouveau document ? Les données saisies seront perdues (le vendeur est conservé)."
      )
    ) {
      useFactureStore.getState().reset();
    }
  };

  const handleExport = async (mode: "pdf" | "print") => {
    if (busy) return;
    setBusy(mode);
    try {
      const s = useFactureStore.getState();
      const inv = buildInvoice(s);
      const tot = buildTotals(s);
      const prix = s.type !== "BON_LIVRAISON" || s.afficherPrixBL;
      if (mode === "pdf") await exportInvoicePdf(inv, tot, prix, s.afficherColonnes);
      else await printInvoice(inv, tot, prix, s.afficherColonnes);
    } finally {
      setBusy(null);
    }
  };

  // Actions injectées dans la barre du haut via le slot (portail).
  const actions = (
    <>
      <Button variant="ghost" onClick={handleNew}>
        <FilePlus2 className="h-4 w-4" />
        <span className="hidden md:inline">Nouveau</span>
      </Button>

      {/* Connexion + sauvegarde en ligne (JSON dans Supabase). */}
      <CloudControls />
      <Button
        variant="glass"
        onClick={() => handleExport("print")}
        disabled={busy !== null}
      >
        {busy === "print" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        <span className="hidden md:inline">Imprimer</span>
      </Button>
      <Button
        variant="accent"
        onClick={() => handleExport("pdf")}
        disabled={busy !== null}
      >
        {busy === "pdf" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Export PDF</span>
      </Button>
    </>
  );

  return (
    <>
      <Suspense fallback={null}>
        <NewDocHandler />
      </Suspense>
      {topbarSlot && createPortal(actions, topbarSlot)}

      {/* Split-screen : éditeur | totaux + aperçu. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full space-y-4 lg:w-[48%]">
          <DocumentSection />
          <CompanySection />
          <CustomerSection />
          <ItemsSection />
        </div>

        <div className="w-full space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-[52%] lg:overflow-y-auto">
          <TotalsPanel />

          {warnings.length > 0 && (
            <div className="glass rounded-glass p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-primary">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Rappels
              </div>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-content-secondary">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <InvoicePreview
            invoice={invoice}
            totals={totals}
            afficherPrix={afficherPrix}
            colonnes={state.afficherColonnes}
          />
        </div>
      </div>
    </>
  );
}
