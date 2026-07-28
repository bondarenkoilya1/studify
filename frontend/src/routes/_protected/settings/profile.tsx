import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "@/entities/user";

export const Route = createFileRoute("/_protected/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useCurrentUser();

  if (!data) {
    return <span>Loading...</span>;
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1 rounded-2xl border bg-card p-6 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Profile settings
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the information associated with your account.
          </p>
        </div>
      </div>
    </div>
  );
}
