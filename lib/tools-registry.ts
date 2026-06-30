import { LayoutDashboard, type LucideIcon } from "lucide-react";

/**
 * A Tool is a single module surfaced in the navigation.
 * The registry below is the ONLY place the shell learns about modules —
 * the sidebar and topbar are driven entirely by this list.
 *
 * To add a module later:
 *   1. Add an entry to `tools` below.
 *   2. Create its route under `app/tools/<id>/page.tsx`.
 * Modules stay hermetic: one module must never import another.
 */
export interface Tool {
  /** Stable, unique identifier (also used as the route segment). */
  id: string;
  /** Human-readable label shown in the nav. */
  label: string;
  /** lucide-react icon component. */
  icon: LucideIcon;
  /** Route the nav item links to. */
  path: string;
  /** Disabled items are rendered greyed-out and are non-clickable. */
  enabled: boolean;
}

export const tools: Tool[] = [
  {
    id: "dashboard",
    label: "Accueil",
    icon: LayoutDashboard,
    path: "/",
    enabled: true,
  },
  // Les futurs outils seront ajoutés ici (un objet = un outil).
];

/**
 * Resolve the active tool from the current pathname.
 * Matches the most specific (longest) path so nested routes resolve
 * to their parent module, while "/" only matches exactly.
 */
export function getActiveTool(pathname: string): Tool | undefined {
  return tools
    .filter((tool) =>
      tool.path === "/" ? pathname === "/" : pathname.startsWith(tool.path)
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
}
