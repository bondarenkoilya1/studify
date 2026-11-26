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
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseDialog.Popup
            className={cn(
              "pointer-events-auto relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/5 bg-background p-6 shadow-2xl outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out",
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
      className={`flex flex-col items-center space-y-3 text-center ${className}`}
      {...props}
    />
  );
}

type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function DialogTitle({ className = "", ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      className={`text-[1.375rem] font-semibold leading-tight tracking-tight text-foreground ${className}`}
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
      className={`text-[15px] leading-snug text-muted-foreground ${className}`}
      {...props}
    />
  );
}

type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

export function DialogBody({ className = "", ...props }: DialogBodyProps) {
  return <div className={`mt-5 ${className}`} {...props} />;
}

type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export function DialogFooter({ className = "", ...props }: DialogFooterProps) {
  return <div className={`mt-6 flex flex-col gap-2 ${className}`} {...props} />;
}

type DialogCloseProps = {
  className?: string;
};

export function DialogClose({ className = "" }: DialogCloseProps) {
  return (
    <BaseDialog.Close
      type="button"
      aria-label="Закрыть"
      className={`absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground ${className}`}
    >
      <X className="size-4" />
    </BaseDialog.Close>
  );
}
