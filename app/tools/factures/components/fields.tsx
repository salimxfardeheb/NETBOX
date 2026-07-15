"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Primitives de formulaire du module Factures — même style que le reste
 * de l'app. Copie locale : un module ne doit jamais importer un autre
 * module (cv-builder a les siennes).
 */

const fieldClasses =
  "w-full rounded-lg border border-glass-border bg-field px-3 py-2 text-sm text-content-primary " +
  "placeholder:text-content-secondary/60 transition-colors hover:border-content-secondary/40 " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

/** Label + contrôle empilés. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-content-secondary">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={cn(fieldClasses, className)} {...props} />;
}

/**
 * Champ numérique : affiche la valeur telle quelle, renvoie un nombre
 * (chaîne vide / saisie invalide → 0) via `onValueChange`.
 */
export function NumberInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const parsed = e.target.valueAsNumber;
        onValueChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      className={cn(fieldClasses, "tabular-nums", className)}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={cn(fieldClasses, "resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldClasses, "appearance-none [&>option]:bg-base", className)}
      {...props}
    />
  );
}
