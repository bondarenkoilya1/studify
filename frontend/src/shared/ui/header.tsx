import { cn } from "@/shared/lib/cn";
import { LoginButton } from "@/shared/ui/login-button";
import { SignupButton } from "@/shared/ui/signup-button";
import type { User } from "@/entities/user";
import { ProfileButton } from "@/shared/ui/profile-button";
import { Link } from "@tanstack/react-router";

export function Header({ user }: { user: User | null }) {
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
        {user ? (
          <ProfileButton userName={user.username} userId={user.id} />
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
