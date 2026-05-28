import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ircom-blue)] text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--ircom-blue)] focus-visible:ring-offset-2",
  secondary:
    "bg-[var(--ircom-navy)] text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--ircom-navy)] focus-visible:ring-offset-2",
  ghost:
    "border border-[var(--ircom-border)] bg-transparent text-[var(--ircom-text-heading)] hover:bg-[var(--ircom-panel-subtle)]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[var(--ircom-touch-min)] items-center justify-center rounded-[var(--ircom-radius-pill)] px-5 py-2.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
