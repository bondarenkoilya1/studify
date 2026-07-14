import { cn } from "@/shared/lib/cn";
import { ProfileButton } from "./profile-button";
import { User } from "@/entities/user";

type HeaderProps = {
  user: User | null;
};

export function Header({ user }: HeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-studify-border bg-studify-surface shadow-sm",
        "px-6 py-4"
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-studify-text">Studify</h1>
        {user ? (
          <ProfileButton userName={user.username} userId={user.id} />
        ) : (
          <div className="text-sm text-studify-muted">Loading...</div>
        )}
      </div>
    </header>
  );
}
