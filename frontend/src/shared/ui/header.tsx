import { cn } from "@/shared/lib/cn";
import { LoginButton } from "@/shared/ui/login-button";
import { SignupButton } from "@/shared/ui/signup-button";
import { useCurrentUser } from "@/entities/user";
import { Link } from "@tanstack/react-router";
import { ProfileMenu } from "@/widgets/profile-menu";
import { ExternalLink, FileCode2, Mail } from "lucide-react";
import { ResendButton } from "@/features/resend-email-confirmation";

export function Header() {
  const { data: user } = useCurrentUser();
  console.log(user);

  return (
    <header
      className={cn(
        "border-b border-studify-border bg-studify-surface shadow-sm",
        "px-6 py-4",
      )}
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-studify-text">
          Studify
        </Link>
        {import.meta.env.DEV && (
          <DevelopmentServices
            isEmailVerified={user?.is_email_verified ?? false}
          />
        )}
        {user ? (
          <ProfileMenu email={user.email} userId={user.id} />
        ) : (
          <div className="flex items-center gap-3">
            <LoginButton />
            <SignupButton />
          </div>
        )}
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
        className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20"
      >
        <FileCode2 className="h-4 w-4" />
        Swagger
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>

      <a
        href="http://localhost:8025"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
      >
        <Mail className="h-4 w-4" />
        Mailpit
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>

      <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
        <ResendButton />
      </div>

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
