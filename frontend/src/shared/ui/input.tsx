import { cn } from "@/shared/lib/cn";
import { forwardRef, type ComponentProps } from "react";

const variants = {
  default: "bg-background focus-visible:bg-background",
  surface: "bg-card",
} as const;

const sizes = {
  medium: "min-h-10 rounded-lg px-3 py-2 text-sm",
  large: "min-h-12 rounded-xl px-4 py-3 text-base",
} as const;

type InputSize = keyof typeof sizes | "lg";

type InputProps = Omit<ComponentProps<"input">, "size"> & {
  variant?: keyof typeof variants;
  size?: InputSize;
  controlSize?: InputSize;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", size, controlSize, ...props }, ref) => {
    const normalizedSize = (controlSize ?? size ?? "medium") as InputSize;
    const resolvedSize: keyof typeof sizes =
      normalizedSize === "lg" ? "large" : normalizedSize;

    return (
      <input
        ref={ref}
        className={cn(
          "form-control block",
          variants[variant],
          sizes[resolvedSize],
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
