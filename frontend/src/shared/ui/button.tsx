import { cn } from "@/shared/lib/cn";
import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-studify-primary text-white shadow-sm hover:bg-studify-primary-hover active:bg-studify-primary-active",
  secondary:
    "border-studify-border bg-studify-surface text-studify-text border shadow-sm hover:bg-studify-field",
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
    className={cn(
      "focus-visible:ring-studify-focus/50 inline-flex cursor-pointer items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      sizes[controlSize],
      className,
    )}
    type={type}
    {...props}
  />
);
