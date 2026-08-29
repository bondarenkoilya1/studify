import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      contentRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="fixed inset-0 cursor-default bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => onOpenChange(false)}
      />

      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative z-10 w-full max-w-2xl rounded-[28px] border border-black/5 bg-background p-6 shadow-2xl outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
      >
        {children}
      </div>
    </div>,
    document.body,
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
    <h2
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
    <p
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
  onClick: () => void;
  className?: string;
};

export function DialogClose({ onClick, className = "" }: DialogCloseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Закрыть"
      className={`absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground ${className}`}
    >
      <X className="size-4" />
    </button>
  );
}
