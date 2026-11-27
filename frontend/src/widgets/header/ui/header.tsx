import { DevelopmentServices } from "./development-services";
import { useCurrentUser } from "@/entities/user";
import { HeaderLogo } from "./logo";
import { HeaderNavigation } from "./navigation";
import { HeaderActions } from "./header-actions";

export function Header() {
  const { data: user } = useCurrentUser();

  return (
    <header className="border-b border-studify-border/70 bg-studify-surface">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <HeaderLogo signedIn={Boolean(user)} />
        {user && <HeaderNavigation />}
        <HeaderActions email={user?.email} avatarUrl={user?.avatar_url} />
      </div>

      {import.meta.env.DEV && (
        <div className="hidden border-t border-studify-border/40 sm:block">
          <div className="mx-auto max-w-7xl px-6 py-1">
            <DevelopmentServices
              isEmailVerified={user?.is_email_verified ?? false}
              isTotpEnabled={user?.is_totp_enabled ?? false}
            />
          </div>
        </div>
      )}
    </header>
  );
}
