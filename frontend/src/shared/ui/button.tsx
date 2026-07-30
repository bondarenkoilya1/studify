import { cn } from "@/shared/lib/cn";
import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-studify-primary text-white shadow-sm hover:bg-studify-hover active:bg-studify-active disabled:bg-studify-primary/15 disabled:text-studify-primary/50 disabled:shadow-none",
  secondary:
    "border border-studify-border bg-studify-surface text-studify-text shadow-sm hover:bg-studify-field disabled:border-studify-border/50 disabled:bg-studify-surface/60 disabled:text-studify-muted disabled:shadow-none",
} as const;

const sizes = {
  medium: "min-h-10 rounded-lg px-4 py-2 text-sm",
  large: "min-h-12 rounded-xl px-5 py-3 text-base",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  controlSize?: keyof typeof sizes;
};

export const Button = ({
  className,
  variant = "primary",
  controlSize = "medium",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-studify-focus/50 disabled:cursor-not-allowed disabled:pointer-events-none",
      variants[variant],
      sizes[controlSize],
      className,
    )}
    {...props}
  />
);
