import { MailWarning } from "lucide-react";
import { ResendEmailButton } from "./resend-email-button";

export function UnverifiedEmailCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <MailWarning className="h-5 w-5 text-amber-500" />

        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Почта не подтверждена
          </p>

          <p className="text-sm text-muted-foreground">
            Проверьте входящие или запросите новое письмо.
          </p>
        </div>
      </div>

      <ResendEmailButton />
    </div>
  );
}
