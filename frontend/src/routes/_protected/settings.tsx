import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Shield, User } from "lucide-react";
import { useCurrentUser } from "@/entities/user";
import { cn } from "@/shared/lib/cn";

export const Route = createFileRoute("/_protected/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useCurrentUser();

  if (!data) {
    return <span>Loading...</span>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <SettingsHeader email={data.email} id={data.id} />

      <div className="flex flex-col gap-6 md:flex-row">
        <SettingsSidebar />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SettingsHeader({ email, id }: { email: string; id: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8">
      <div className="flex items-center gap-5">
        <div className="relative flex h-24 w-24 shrink-0 select-none items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-700 via-zinc-900 to-black text-3xl font-semibold text-white shadow-inner">
          <div className="absolute -inset-4 bg-white/5 blur-xl" />

          <span className="relative">
            {email.substring(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

          <p className="text-sm text-muted-foreground">
            Manage your account information and preferences.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <p className="text-sm font-medium">{email}</p>

            <span className="rounded-full border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              ID: {id}
            </span>
          </div>
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
        Profile
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
        Password and Security
      </Link>
    </nav>
  );
}
