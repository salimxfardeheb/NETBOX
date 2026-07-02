import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "glass" | "accent" | "ghost" | "add";
type ButtonSize = "sm" | "md" | "icon" | "icon-sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Secondary — solid neutral surface, no border, soft depth.
  glass:
    "bg-btn text-content-primary shadow-sm hover:bg-btn-hover active:bg-btn",
  // Primary — solid accent with a soft coloured shadow; lifts on hover.
  accent:
    "bg-accent text-white shadow-[0_6px_18px_-6px_var(--accent-glow)] " +
    "hover:brightness-110 hover:-translate-y-px active:translate-y-0",
  // Tertiary — minimal, for icon controls; text kept readable at rest.
  ghost:
    "bg-transparent text-content-secondary hover:text-content-primary hover:bg-surface-hover",
  // Additive — solid neutral button for "add" actions.
  add:
    "bg-btn text-content-primary shadow-sm hover:bg-btn-hover active:bg-btn",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  // Boutons carrés icône uniquement : PAS de padding horizontal (sinon
  // l'icône serait écrasée) — la taille est fixée par h/w.
  icon: "h-9 w-9 rounded-lg gap-1",
  "icon-sm": "h-7 w-7 rounded-md",
};

/**
 * Glass-themed button. Part of the shared design system —
 * lives in components/ui so any module can reuse it.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "glass", size = "md", className, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          // Accessible focus ring (the component owns it since it clears the
          // global outline) — offset against the app's base background.
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
