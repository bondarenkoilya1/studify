import { useProfileMenu } from "../model/use-profile-menu";
import { ProfileMenuContent } from "./profile-menu-content";
import { ProfileMenuTrigger } from "./profile-menu-trigger";

interface Props {
  email: string;
  userId: number;
}

export function ProfileMenu({ email, userId }: Props) {
  const { isOpen, menuRef, toggleMenu, closeMenu } = useProfileMenu();

  return (
    <div ref={menuRef} className="relative">
      <ProfileMenuTrigger
        email={email}
        userId={userId}
        isOpen={isOpen}
        onClick={toggleMenu}
      />

      {isOpen && <ProfileMenuContent onClose={closeMenu} />}
    </div>
  );
}
