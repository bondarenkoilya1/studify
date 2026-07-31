import { cn } from "@/shared/lib/cn";
import { useCurrentUser } from "@/entities/user";
import { Link } from "@tanstack/react-router";
import { ProfileMenu } from "@/widgets/profile-menu";
import { LoginButton } from "@/features/auth/login-by-email";
import { ExternalLink, FileCode2, Mail } from "lucide-react";
import { RegisterButton } from "@/features/auth/register-by-email";

export function Header() {
  const { data: user } = useCurrentUser();

  return (
    <header
      className={cn(
        "border-b border-studify-border bg-studify-surface shadow-sm",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
        <Link to="/" className="shrink-0 text-2xl font-bold text-studify-text">
          Studify
        </Link>

        {import.meta.env.DEV && (
          <div className="flex flex-1 justify-center">
            <DevelopmentServices
              isEmailVerified={user?.is_email_verified ?? false}
            />
          </div>
        )}

        <div className="shrink-0">
          {user ? (
            <ProfileMenu email={user.email} />
          ) : (
            <div className="flex items-center gap-3">
              <LoginButton />
              <RegisterButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DevelopmentServices({
  isEmailVerified,
}: {
  isEmailVerified: boolean;
}) {
  return (
    <nav className="flex items-center gap-2">
      <a
        href="http://localhost:8081"
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5",
          "border border-green-500/30 bg-green-500/10",
          "text-sm font-medium text-green-400",
          "transition-colors hover:bg-green-500/20",
        )}
      >
        <FileCode2 className="h-4 w-4" />
        Swagger
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>

      <a
        href="http://localhost:8025"
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5",
          "border border-sky-500/30 bg-sky-500/10",
          "text-sm font-medium text-sky-400",
          "transition-colors hover:bg-sky-500/20",
        )}
      >
        <Mail className="h-4 w-4" />
        Mailpit
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>

      <div
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium",
          isEmailVerified
            ? "border border-green-500/30 bg-green-500/10 text-green-400"
            : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        )}
      >
        {isEmailVerified ? "Verified" : "Not verified"}
      </div>
    </nav>
  );
}
