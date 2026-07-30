import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Security settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account security and authentication.
        </p>
      </div>

      <div className="my-6 border-t" />

      <div className="space-y-6">
        {/* Change password */}
        {/* Two-factor authentication */}
        {/* Sessions */}
      </div>
    </div>
  );
}
