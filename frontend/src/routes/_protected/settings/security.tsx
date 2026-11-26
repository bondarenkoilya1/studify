import { Card } from "@/shared/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordSection } from "@/features/profile/change-password";
import { TotpSection } from "@/features/profile/manage-totp";

export const Route = createFileRoute("/_protected/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-w-0">
      <Card className="p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Настройки безопасности
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте паролем и двухфакторной аутентификацией.
          </p>
        </div>

        <div className="my-6 border-t" />

        <div className="space-y-6">
          <ChangePasswordSection />
          <TotpSection />
        </div>
      </Card>
    </div>
  );
}
