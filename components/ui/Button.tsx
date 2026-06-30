import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "glass" | "accent" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Frosted glass surface that brightens on hover.
  glass: "glass glass-interactive text-content-primary",
  // Solid accent — for primary actions.
  accent:
    "bg-accent text-white border border-transparent hover:brightness-110 shadow-[0_4px_20px_-4px_var(--accent-glow)]",
  // Minimal — no surface until hovered.
  ghost:
    "bg-transparent text-content-secondary hover:text-content-primary hover:bg-glass-hover border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
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
          "focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none",
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
