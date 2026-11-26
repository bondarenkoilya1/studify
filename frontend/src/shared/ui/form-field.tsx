import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type FormFieldProps = {
  children: ReactNode;
  htmlFor: string;
  label: string;
};

export const FormField = ({ children, htmlFor, label }: FormFieldProps) => (
  <div>
    <label
      className="mb-2 block text-sm font-medium text-foreground"
      htmlFor={htmlFor}
    >
      {label}
    </label>
    {children}
  </div>
);

type FormErrorProps = ComponentProps<"p"> & {
  variant?: "field" | "summary";
};

export function FormError({
  children,
  className,
  variant = "field",
  ...props
}: FormErrorProps) {
  if (!children) return null;

  return (
    <p
      role={variant === "summary" ? "alert" : undefined}
      className={cn(
        "mt-1.5 text-sm leading-snug text-destructive",
        variant === "summary" &&
          "mt-0 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2.5",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
