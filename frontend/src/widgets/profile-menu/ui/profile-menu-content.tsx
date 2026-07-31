import { Link } from "@tanstack/react-router";
import { profileMenuItems } from "../config/menu-items";
import { LogoutButton } from "@/features/logout-button";

interface Props {
  onClose: () => void;
}

export function ProfileMenuContent({ onClose }: Props) {
  return (
    <div role="menu" className="...">
      {profileMenuItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link key={item.to} to={item.to} onClick={onClose} className="...">
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="h-px bg-studify-border my-1" />

      <LogoutButton />
    </div>
  );
}
