import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "@/entities/user";
import { ChangeEmailSection } from "@/features/profile/change-email";
import { EmailVerificationSection } from "@/features/auth/resend-email-confirmation";

export const Route = createFileRoute("/_protected/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useCurrentUser();

  if (!data) {
    return <span>Загрузка...</span>;
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1 rounded-2xl border bg-card p-6 shadow-xs">
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
      </div>
    </div>
  );
}
