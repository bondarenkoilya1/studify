import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordSection } from "@/features/profile/change-password";
import { TotpSection } from "@/features/profile/manage-totp";

export const Route = createFileRoute("/_protected/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-w-0">
      <div className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Настройки безопасности
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your password and account security.
          </p>
        </div>

        <div className="my-6 border-t" />

        <div className="space-y-6">
          <ChangePasswordSection />
          <TotpSection />
        </div>
      </div>
    </div>
  );
}
