import type { ButtonHTMLAttributes } from "react";
import { CornerMarks } from "./Blueprint";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

// Condensed, square, hairline-bordered — a button is a drawn object like
// everything else. Only the primary carries a fill.
const BASE =
  "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap border font-display font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "blueprint border-primary bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border-border text-foreground hover:bg-foreground/[0.07] active:bg-foreground/[0.14]",
  ghost:
    "border-transparent text-primary hover:bg-primary/10 active:bg-primary/[0.18]",
  danger:
    "blueprint border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

/** The variants drawn as framed objects, so they get registration marks. */
const FRAMED: ReadonlySet<ButtonVariant> = new Set<ButtonVariant>([
  "primary",
  "danger",
]);

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3.5 text-sm",
};

/** Shared classes, so `<Link>` and `<button>` can look identical. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {FRAMED.has(variant) ? <CornerMarks /> : null}
      {children}
    </button>
  );
}
