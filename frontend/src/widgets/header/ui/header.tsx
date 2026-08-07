import { DevelopmentServices } from "./development-services";
import { useCurrentUser } from "@/entities/user";
import { HeaderLogo } from "./logo";
import { HeaderNavigation } from "./navigation";
import { HeaderActions } from "./header-actions";

export function Header() {
  const { data: user } = useCurrentUser();

  return (
    <header className="border-b border-studify-border bg-studify-surface shadow-sm">
      <div className="mx-auto flex h-16 max-w-420 items-center px-6">
        {/* Left */}
        <div className="shrink-0">
          <HeaderLogo />
        </div>

        {/* Center */}
        <div className="flex flex-1 items-center justify-center gap-8">
          {user && <HeaderNavigation />}

          {import.meta.env.DEV && (
            <DevelopmentServices
              isEmailVerified={user?.isEmailVerified ?? false}
              isTotpEnabled={user?.isTotpEnabled ?? false}
            />
          )}
        </div>

        {/* Right */}
        <div className="shrink-0">
          <HeaderActions email={user?.email} />
        </div>
      </div>
    </header>
  );
}
