import { CheckCircle2 } from "lucide-react";

export function VerifiedEmailCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
      <CheckCircle2 className="h-5 w-5 text-emerald-500" />

      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Email verified
        </p>

        <p className="text-sm text-muted-foreground">
          Your email address has been successfully confirmed.
        </p>
      </div>
    </div>
  );
}
