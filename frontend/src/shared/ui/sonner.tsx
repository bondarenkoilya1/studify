import type { CSSProperties } from "react";
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export { toast } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      duration={5000}
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4 text-emerald-600" />,
        info: <Info className="size-4 text-studify-primary" />,
        warning: <TriangleAlert className="size-4 text-amber-500" />,
        error: <OctagonX className="size-4 text-destructive" />,
        loading: (
          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      {...props}
    />
  );
}
