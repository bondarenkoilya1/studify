import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
