"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
  // Sous-menus dépliés manuellement (sinon : déplié si la route est active).
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  return (
    <aside
      className={cn(
        "glass fixed inset-y-3 left-3 z-20 flex flex-col rounded-glass p-3",
        "w-16 md:w-60",
        "transition-all duration-200"
      )}
    >
      {/* Logo / wordmark */}
      <div className="flex h-14 items-center px-2">
        <Image
          src="/netbox-logo.png"
          alt="NETBOX"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 object-contain"
        />
        <span className="ml-3 hidden text-base font-semibold tracking-tight text-content-primary md:inline">
          NETBOX
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

          // Entrée avec sous-menu : le clic déplie la liste d'options
          // au lieu de naviguer.
          if (tool.children) {
            const isOpen = openMenus[tool.id] ?? isActive;
            return (
              <div key={tool.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  title={tool.label}
                  onClick={() =>
                    setOpenMenus((m) => ({ ...m, [tool.id]: !isOpen }))
                  }
                  className={cn(
                    "group flex w-full items-center rounded-xl px-3 py-2.5 transition-all duration-200",
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
                  <span className="ml-3 hidden flex-1 truncate text-left text-sm font-medium md:inline">
                    {tool.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "ml-auto hidden h-4 w-4 shrink-0 transition-transform md:block",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="mt-1 flex flex-col gap-1">
                    {tool.children.map((child) => {
                      const ChildIcon = child.icon;
                      // Actif sur correspondance exacte du chemin (sans query).
                      const childActive =
                        pathname === child.path.split("?")[0];
                      return (
                        <Link
                          key={child.id}
                          href={child.path}
                          title={child.label}
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "group flex items-center rounded-lg px-3 py-2 md:ml-6 md:px-2",
                            "text-sm text-content-secondary transition-all duration-200",
                            "hover:text-content-primary",
                            childActive
                              ? "glass-active text-content-primary"
                              : "hover:bg-glass-hover"
                          )}
                        >
                          <ChildIcon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              childActive && "text-accent"
                            )}
                            aria-hidden="true"
                          />
                          <span className="ml-2.5 hidden truncate md:inline">
                            {child.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
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
