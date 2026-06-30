import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true the card lifts slightly and brightens on hover. */
  interactive?: boolean;
}

/**
 * Glass card surface — the base container of the design system.
 * Generous rounding + the shared `.glass` look. Lives in components/ui
 * so any module can compose its content inside it.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass rounded-glass p-6",
          interactive &&
            "glass-interactive cursor-pointer hover:-translate-y-0.5",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

/** Optional header slot for a card. */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

/** Card title — semibold, primary text. */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-content-primary", className)}
      {...props}
    />
  );
}

/** Card description — muted secondary text. */
export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-content-secondary", className)} {...props} />
  );
}
