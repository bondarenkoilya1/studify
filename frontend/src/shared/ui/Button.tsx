import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-primary-soft)]",
  secondary:
    "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] focus:ring-[var(--color-primary-soft)]",
  ghost:
    "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus:ring-[var(--color-primary-soft)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-red-700 focus:ring-[var(--color-danger-soft)]",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`h-11 rounded-xl px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-300 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
