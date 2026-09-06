import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";

interface Props {
  email: string;
  avatarUrl?: string | null;
  isOpen: boolean;
  onClick: () => void;
}

export function ProfileMenuTrigger({ email, avatarUrl, isOpen, onClick }: Props) {
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
      <Avatar email={email} avatarUrl={avatarUrl} size={32} />

      <span className="max-w-64 truncate font-medium text-studify-text">
        {email}
      </span>
    </button>
  );
}
