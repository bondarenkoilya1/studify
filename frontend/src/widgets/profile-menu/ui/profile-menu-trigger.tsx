import { cn } from "@/shared/lib/cn";

interface Props {
  email: string;
  isOpen: boolean;
  onClick: () => void;
}

export function ProfileMenuTrigger({ email, isOpen, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-studify-border",
        "bg-studify-surface px-3 py-2 text-sm shadow-sm",
        "transition-colors hover:bg-studify-field",
        "focus-visible:ring-3 focus-visible:ring-studify-focus/50",
        "focus-visible:outline-none",
      )}
    >
      <div
        className={cn(
          "relative flex h-8 w-8 shrink-0 select-none items-center justify-center",
          "overflow-hidden rounded-full border border-white/10",
          "bg-linear-to-br from-zinc-700 via-zinc-900 to-black",
          "text-xs font-semibold text-white shadow-inner",
        )}
      >
        <div className="absolute -inset-4 bg-white/5 blur-xl" />

        <span className="relative">{email.substring(0, 2).toUpperCase()}</span>
      </div>

      <span className="max-w-64 truncate font-medium text-studify-text">
        {email}
      </span>
    </button>
  );
}
