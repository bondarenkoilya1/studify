import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordSection } from "@/features/profile/change-password";
import { TotpSection } from "@/features/profile/manage-totp";

export const Route = createFileRoute("/_protected/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1 rounded-2xl border bg-card p-6 shadow-xs">
        <div>
          <h2 className="text-lg-semibold tracking-tight">Security settings</h2>

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
