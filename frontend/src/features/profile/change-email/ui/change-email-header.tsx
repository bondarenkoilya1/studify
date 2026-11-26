import { useCurrentUser } from "@/entities/user";

export function ChangeEmailHeader() {
  const { data } = useCurrentUser();

  const isDisabled = !data?.is_email_verified;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Адрес почты</h3>

        {isDisabled && (
          <span className="rounded-full border border-studify-border bg-studify-surface px-2.5 py-1 text-xs font-medium text-studify-muted">
            Сначала подтвердите текущий адрес
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Измените адрес почты для входа и уведомлений.
      </p>
    </div>
  );
}
