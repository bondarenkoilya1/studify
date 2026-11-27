import { useState } from "react";
import { Popover, PopoverContent } from "@/shared/ui/popover";
import { ProfileMenuContent } from "./profile-menu-content";
import { ProfileMenuTrigger } from "./profile-menu-trigger";

export function ProfileMenu({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ProfileMenuTrigger email={email} avatarUrl={avatarUrl} />
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label="Настройки аккаунта"
        className="w-64 max-w-(--available-width) gap-0.5 border border-studify-border bg-studify-surface p-1.5"
      >
        <ProfileMenuContent email={email} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
