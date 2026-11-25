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
      <SettingsHeader
        email={data.email}
        avatarUrl={data.avatar_url}
      />

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <SettingsSidebar />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
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
    <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs">
      <div className="relative flex items-center gap-4 p-5 sm:gap-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <AvatarUploadField
          email={email}
          currentAvatarUrl={avatarUrl}
          size={72}
          className="shrink-0 text-2xl sm:size-24 sm:text-3xl"
        />

        <div className="relative min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Настройки
          </h1>

          <p className="text-sm text-muted-foreground">
            Управляйте аккаунтом и настройками.
          </p>

          <p className="truncate pt-1 text-sm font-medium">
            {email}
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsSidebar() {
  const linkClass =
    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors";

  const activeClass =
    "bg-zinc-100 text-foreground border border-zinc-200 shadow-sm";

  const inactiveClass =
    "text-muted-foreground border border-transparent hover:bg-zinc-50 hover:text-foreground";

  return (
    <nav className="flex w-full shrink-0 flex-row gap-1 md:w-52 md:flex-col">
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
        Пароль и безопасность
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
