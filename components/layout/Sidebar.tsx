"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools-registry";
import { cn } from "@/lib/cn";

/**
 * Vertical glass navigation, fixed to the left.
 * It owns NO list of its own — every item is derived from the
 * tools registry, so adding a module updates the nav automatically.
 *
 * Responsive: icon-only rail on mobile, icon + label from `md` up.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "glass fixed inset-y-3 left-3 z-20 flex flex-col rounded-glass p-3",
        "w-16 md:w-60",
        "transition-all duration-200"
      )}
    >
      {/* Logo / wordmark */}
      <div className="flex h-12 items-center px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
          <span className="text-lg font-bold">S</span>
        </div>
        <span className="ml-3 hidden text-base font-semibold tracking-tight text-content-primary md:inline">
          SIMOUX
        </span>
      </div>

      {/* Navigation — mapped from the registry */}
      <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Modules">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive =
            tool.path === "/"
              ? pathname === "/"
              : pathname.startsWith(tool.path);

          // Disabled modules render as non-interactive, greyed rows.
          if (!tool.enabled) {
            return (
              <div
                key={tool.id}
                aria-disabled="true"
                title={`${tool.label} (bientôt disponible)`}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2.5",
                  "cursor-not-allowed opacity-35"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="ml-3 hidden truncate text-sm font-medium md:inline">
                  {tool.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={tool.id}
              href={tool.path}
              aria-current={isActive ? "page" : undefined}
              title={tool.label}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 transition-all duration-200",
                "text-content-secondary hover:text-content-primary",
                isActive
                  ? "glass-active text-content-primary"
                  : "hover:bg-glass-hover"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-accent" : "group-hover:text-content-primary"
                )}
                aria-hidden="true"
              />
              <span className="ml-3 hidden truncate text-sm font-medium md:inline">
                {tool.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer slot — version / status, kept minimal for now. */}
      <div className="hidden px-3 py-2 text-xs text-content-secondary md:block">
        v0.1.0
      </div>
    </aside>
  );
}
