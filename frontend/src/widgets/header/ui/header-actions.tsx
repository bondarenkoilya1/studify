import { LoginButton } from "@/features/auth/login-by-email";
import { RegisterButton } from "@/features/auth/register-by-email";
import { ProfileMenu } from "@/widgets/profile-menu";

export function HeaderActions({
  email,
  avatarUrl,
}: {
  email: string | undefined;
  avatarUrl?: string | null;
}) {
  if (email) return <ProfileMenu email={email} avatarUrl={avatarUrl} />;

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-2">
      <LoginButton />
      <RegisterButton />
    </div>
  );
}
