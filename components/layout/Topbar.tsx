"use client";

import { usePathname } from "next/navigation";
import { getActiveTool } from "@/lib/tools-registry";

/**
 * Thin glass bar at the top of the content area.
 * Shows the active module's label (resolved from the route) and keeps
 * a right-hand slot free for future actions (search, profile, etc.).
 */
export function Topbar() {
  const pathname = usePathname();
  const activeTool = getActiveTool(pathname);

  return (
    <header className="glass sticky top-3 z-10 flex h-14 items-center justify-between rounded-glass px-5">
      <h1 className="text-sm font-semibold text-content-primary">
        {activeTool?.label ?? "SIMOUX"}
      </h1>

      {/* Reserved for future actions — intentionally empty for now. */}
      <div className="flex items-center gap-2" aria-label="Actions" />
    </header>
  );
}
