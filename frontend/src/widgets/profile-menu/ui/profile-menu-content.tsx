import { Link } from "@tanstack/react-router";
import { profileMenuItems } from "../config/menu-items";
import { LogoutButton } from "@/features/auth/logout-button";

export function ProfileMenuContent({
  email,
  onClose,
}: {
  email: string;
  onClose: () => void;
}) {
  return (
    <>
      <p className="border-b border-studify-border/50 px-3 py-2 text-xs wrap-anywhere text-studify-muted">
        {email}
      </p>
      {profileMenuItems.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-studify-text hover:bg-studify-field focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-studify-active aria-[current=page]:bg-studify-wash aria-[current=page]:text-studify-active"
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
      <div className="my-1 h-px bg-studify-border/50" />
      <LogoutButton />
    </>
  );
}
