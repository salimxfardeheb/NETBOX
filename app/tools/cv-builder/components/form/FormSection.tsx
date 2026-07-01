"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Carte "glass" repliable — une section du formulaire.
 * Ouverte par défaut ; le contenu est démonté quand elle est repliée.
 */
export function FormSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="glass rounded-glass">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-content-primary">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-content-secondary transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="space-y-4 px-5 pb-5">{children}</div>}
    </section>
  );
}
