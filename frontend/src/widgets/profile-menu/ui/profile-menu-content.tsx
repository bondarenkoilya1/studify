import { Link } from "@tanstack/react-router";
import { profileMenuItems } from "../config/menu-items";
import { LogoutButton } from "@/features/logout-button";
import { cn } from "@/shared/lib/cn";

interface Props {
  onClose: () => void;
}

const itemClassName = cn(
  "flex w-full items-center gap-2 rounded-lg px-4 py-2",
  "text-left text-sm font-medium text-studify-text",
  "bg-studify-surface transition-colors",
  "hover:bg-studify-field",
  "focus-visible:bg-studify-field focus-visible:outline-none",
);

export function ProfileMenuContent({ onClose }: Props) {
  return (
    <div
      id="profile-menu"
      role="menu"
      className={cn(
        "absolute right-0 top-full z-10 mt-2 w-52",
        "rounded-lg border border-studify-border",
        "bg-studify-surface p-1 shadow-lg",
        "flex flex-col gap-0.5",
      )}
    >
      {profileMenuItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            role="menuitem"
            onClick={onClose}
            className={itemClassName}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="my-1 h-px bg-studify-border" />

      <div role="menuitem" onClick={onClose}>
        <LogoutButton />
      </div>
    </div>
  );
}
