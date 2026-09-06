import { useProfileMenu } from "../model/use-profile-menu";
import { ProfileMenuContent } from "./profile-menu-content";
import { ProfileMenuTrigger } from "./profile-menu-trigger";
import type { JSX } from "react";

export function ProfileMenu({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl?: string | null;
}): JSX.Element {
  const { isOpen, menuRef, toggleMenu, closeMenu } = useProfileMenu();

  return (
    <div ref={menuRef} className="relative">
      <ProfileMenuTrigger
        email={email}
        avatarUrl={avatarUrl}
        isOpen={isOpen}
        onClick={toggleMenu}
      />

      {isOpen && <ProfileMenuContent onClose={closeMenu} />}
    </div>
  );
}
