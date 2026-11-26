import type { HTMLAttributes, ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  children,
  className,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in duration-200" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseDialog.Popup
            className={cn(
              "pointer-events-auto relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-popover p-5 text-popover-foreground shadow-lg outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200 sm:p-6",
              className,
            )}
          >
            {children}
          </BaseDialog.Popup>
        </div>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

type DialogContentProps = HTMLAttributes<HTMLDivElement>;

export function DialogContent({
  className = "",
  ...props
}: DialogContentProps) {
  return <div className={className} {...props} />;
}

type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

export function DialogHeader({ className = "", ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 px-8 text-center",
        className,
      )}
      {...props}
    />
  );
}

type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function DialogTitle({ className = "", ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      className={cn(
        "text-xl font-semibold leading-tight tracking-tight sm:text-2xl",
        className,
      )}
      {...props}
    />
  );
}

type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function DialogDescription({
  className = "",
  ...props
}: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      className={cn("text-sm leading-snug text-muted-foreground", className)}
      {...props}
    />
  );
}

type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

export function DialogBody({ className = "", ...props }: DialogBodyProps) {
  return <div className={cn("mt-5", className)} {...props} />;
}

type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export function DialogFooter({ className = "", ...props }: DialogFooterProps) {
  return (
    <div className={cn("mt-6 flex flex-col gap-2", className)} {...props} />
  );
}

type DialogCloseProps = {
  className?: string;
};

export function DialogClose({ className = "" }: DialogCloseProps) {
  return (
    <BaseDialog.Close
      type="button"
      aria-label="Закрыть"
      className={cn(
        "absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <X className="size-4" />
    </BaseDialog.Close>
  );
}
