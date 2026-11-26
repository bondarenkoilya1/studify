import { Card } from "@/shared/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "@/entities/user";
import { ChangeEmailSection } from "@/features/profile/change-email";
import { EmailVerificationSection } from "@/features/profile/resend-email-confirmation";

export const Route = createFileRoute("/_protected/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useCurrentUser();

  if (!data) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border bg-card shadow-xs" />
    );
  }

  return (
    <div className="min-w-0">
      <Card className="p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Настройки профиля
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте личной информацией и настройками почты.
          </p>
        </div>

        <div className="my-6 border-t" />

        <div className="space-y-6">
          <ChangeEmailSection />
          <div className="border-t" />
          <EmailVerificationSection />
        </div>
      </Card>
    </div>
  );
}
