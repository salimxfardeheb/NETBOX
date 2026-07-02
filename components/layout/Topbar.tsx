"use client";

import { usePathname } from "next/navigation";
import { getActiveTool } from "@/lib/tools-registry";
import { useTopbarSlot } from "@/lib/topbar-slot";

/**
 * Thin glass bar at the top of the content area.
 * Shows the active module's label (resolved from the route) and exposes
 * a right-hand slot: pages inject their own toolbar here (via a portal)
 * so there is a single top bar instead of a separate action bar.
 */
export function Topbar() {
  const pathname = usePathname();
  const activeTool = getActiveTool(pathname);
  const setSlot = useTopbarSlot((s) => s.setEl);

  return (
    <header className="glass sticky top-3 z-10 flex h-14 items-center justify-between gap-3 rounded-glass px-5">
      <h1 className="shrink-0 text-sm font-semibold text-content-primary">
        {activeTool?.label ?? "SIMOUX"}
      </h1>

      {/* Slot d'actions rempli par la page active (portail). */}
      <div
        ref={setSlot}
        className="flex min-w-0 flex-1 items-center justify-end gap-3"
        aria-label="Actions"
      />
    </header>
  );
}
