import { useCurrentUser } from "@/entities/user";

export function ChangeEmailHeader() {
  const { data } = useCurrentUser();

  const isDisabled = !data?.is_email_verified;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Адрес почты</h3>

        {isDisabled && (
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
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
