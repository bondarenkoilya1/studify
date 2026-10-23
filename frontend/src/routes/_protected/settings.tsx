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
    return <span>Загрузка...</span>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <SettingsHeader
        email={data.email}
        avatarUrl={data.avatar_url}
      />

      <div className="flex flex-col gap-6 md:flex-row">
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
    <div className="overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8">
      <div className="flex items-center gap-5">
        <AvatarUploadField
          email={email}
          currentAvatarUrl={avatarUrl}
          size={96}
          className="text-3xl"
        />

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>

          <p className="text-sm text-muted-foreground">
            Управляйте аккаунтом и настройками.
          </p>

          <p className="flex flex-wrap items-center gap-2 pt-1 text-sm font-medium">
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
