import { cn } from "@/shared/lib/cn";
import type { ComponentProps } from "react";

const variants = {
  default:
    "border-studify-border bg-studify-field focus:border-studify-primary focus:bg-studify-surface",
  surface: "border-studify-border bg-studify-surface focus:border-studify-primary",
} as const;

const sizes = {
  medium: "min-h-10 rounded-lg px-3 py-2 text-sm",
  large: "min-h-12 rounded-xl px-4 py-3 text-base",
} as const;

type InputProps = Omit<ComponentProps<"input">, "size"> & {
  variant?: keyof typeof variants;
  controlSize?: keyof typeof sizes;
};

export const Input = ({
  className,
  variant = "default",
  controlSize = "medium",
  ...props
}: InputProps) => (
  <input
    className={cn(
      "text-studify-text placeholder:text-studify-muted focus:ring-studify-focus/40 block w-full border shadow-sm outline-none transition-colors focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      sizes[controlSize],
      className,
    )}
    {...props}
  />
);
