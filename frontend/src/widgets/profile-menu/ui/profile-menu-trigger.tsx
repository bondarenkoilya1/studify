import { Avatar } from "@/widgets/avatar";
import { PopoverTrigger } from "@/shared/ui/popover";

export function ProfileMenuTrigger({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl?: string | null;
}) {
  return (
    <PopoverTrigger
      aria-label={`Меню аккаунта ${email}`}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-studify-border/70 bg-studify-surface px-1.5 text-sm font-medium text-studify-text hover:bg-studify-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studify-active xl:px-2.5"
    >
      <span aria-hidden="true">
        <Avatar email={email} avatarUrl={avatarUrl} size={30} alt="" />
      </span>
      <span className="hidden max-w-36 truncate xl:block">{email}</span>
    </PopoverTrigger>
  );
}
