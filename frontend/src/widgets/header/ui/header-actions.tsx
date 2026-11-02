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
  return (
    <div className="ml-auto flex items-center gap-4">
      {email ? (
        <>
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
