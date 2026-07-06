import { cn } from "@/shared/lib/cn";
import type { ComponentProps } from "react";

type CenteredPageProps = ComponentProps<"main">;

export const CenteredPage = ({ className, ...props }: CenteredPageProps) => (
  <main
    className={cn(
      "from-studify-canvas to-studify-wash text-studify-text flex flex-1 items-center justify-center bg-linear-to-b px-5 py-10 font-sans sm:px-8 sm:py-16",
      className,
    )}
    {...props}
  />
);
