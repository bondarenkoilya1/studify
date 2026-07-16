import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { ProfileButton } from "./profile-button";
import { LoginButton } from "@/shared/ui/login-button";
import { SignupButton } from "@/shared/ui/signup-button";
import { User } from "@/entities/user";

type HeaderProps = {
  user: User | null;
};

export function Header({ user }: HeaderProps) {
  return (
    <header
      className={cn("border-b border-studify-border bg-studify-surface shadow-sm", "px-6 py-4")}
    >
      <div className="flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-studify-text">Studify</Link>
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
