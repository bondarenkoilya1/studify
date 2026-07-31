import { MailWarning } from "lucide-react";
import { ResendEmailButton } from "./resend-email-button";

export function UnverifiedEmailCard() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
      <div className="flex items-center gap-3">
        <MailWarning className="h-5 w-5 text-amber-500" />

        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Email not verified
          </p>

          <p className="text-sm text-muted-foreground">
            Check your inbox or request a new confirmation email.
          </p>
        </div>
      </div>

      <ResendEmailButton />
    </div>
  );
}
