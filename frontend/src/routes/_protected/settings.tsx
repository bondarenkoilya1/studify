import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Laptop, Shield, User } from "lucide-react";
import { useCurrentUser } from "@/entities/user";
import { cn } from "@/shared/lib/cn";
import { AvatarUploadField } from "@/widgets/avatar";

export const Route = createFileRoute("/_protected/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useCurrentUser();

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-40 animate-pulse rounded-2xl border bg-card shadow-xs" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <SettingsHeader email={data.email} avatarUrl={data.avatar_url} />

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <SettingsSidebar />

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function SettingsHeader({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl?: string | null;
}) {
  return (
    <header className="rounded-2xl border bg-card text-card-foreground">
      <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <AvatarUploadField
          email={email}
          currentAvatarUrl={avatarUrl}
          size={64}
          className="shrink-0 text-xl"
        />

        <div className="relative min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Настройки
          </h1>

          <p className="text-sm wrap-anywhere text-muted-foreground">{email}</p>
        </div>
      </div>
    </header>
  );
}

function SettingsSidebar() {
  const linkClass =
    "flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring";

  const activeClass = "bg-muted text-foreground border border-border shadow-sm";

  const inactiveClass =
    "text-muted-foreground border border-transparent hover:bg-muted/50 hover:text-foreground";

  return (
    <nav
      aria-label="Настройки аккаунта"
      className="flex w-full shrink-0 flex-row flex-wrap gap-1 md:w-52 md:flex-col md:flex-nowrap"
    >
      <Link
        to="/settings/profile"
        activeOptions={{ exact: true }}
        className={cn(linkClass, inactiveClass)}
        activeProps={{
          className: activeClass,
        }}
      >
        <User className="h-4 w-4" />
        Профиль
      </Link>

      <Link
        to="/settings/security"
        activeOptions={{ exact: true }}
        className={cn(linkClass, inactiveClass)}
        activeProps={{
          className: activeClass,
        }}
      >
        <Shield className="h-4 w-4" />
        Безопасность
      </Link>

      <Link
        to="/settings/sessions"
        activeOptions={{ exact: true }}
        className={cn(linkClass, inactiveClass)}
        activeProps={{
          className: activeClass,
        }}
      >
        <Laptop className="h-4 w-4" />
        Сессии
      </Link>
    </nav>
  );
}
