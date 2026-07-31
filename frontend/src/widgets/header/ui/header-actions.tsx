import { LoginButton } from "@/features/auth/login-by-email";
import { RegisterButton } from "@/features/auth/register-by-email";
import { ProfileMenu } from "@/widgets/profile-menu";

export function HeaderActions({ email }: { email: string | undefined }) {
  return (
    <div className="ml-auto flex items-center gap-4">
      {email ? (
        <ProfileMenu email={email} />
      ) : (
        <>
          <LoginButton />
          <RegisterButton />
        </>
      )}
    </div>
  );
}
