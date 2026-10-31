import { Link } from "@tanstack/react-router";
import { Share2 } from "lucide-react";

import { LoginButton } from "@/features/auth/login-by-email";
import { RegisterButton } from "@/features/auth/register-by-email";
import { Button } from "@/shared/ui/button";
import { ProfileMenu } from "@/widgets/profile-menu";

export function HeaderActions({
  email,
  avatarUrl,
}: {
  email: string | undefined;
  avatarUrl?: string | null;
}) {
  return (
    <div className="ml-auto flex items-center gap-4">
      {email ? (
        <>
          <Link to="/share">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="size-4" />
              <span>Поделиться проектом</span>
            </Button>
          </Link>
          <ProfileMenu email={email} avatarUrl={avatarUrl} />
        </>
      ) : (
        <>
          <LoginButton />
          <RegisterButton />
        </>
      )}
    </div>
  );
}
