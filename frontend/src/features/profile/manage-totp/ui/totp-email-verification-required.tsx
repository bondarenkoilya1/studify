import { ShieldAlert } from "lucide-react";

export function TotpEmailVerificationRequired() {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-5">
      <div className="rounded-full bg-amber-100 p-2">
        <ShieldAlert className="size-5 text-amber-600" />
      </div>

      <div>
        <h3 className="font-semibold">Подтвердите почту для настройки 2FA</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          После подтверждения адреса можно подключить приложение-аутентификатор.
        </p>
      </div>
    </div>
  );
}
