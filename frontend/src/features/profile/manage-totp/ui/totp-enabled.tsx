import { ShieldCheck } from "lucide-react";
import { DisableTotpButton } from "./disable-totp-button";
import { RegenerateRecoveryCodesButton } from "./regenerate-recovery-codes-button";

export function TotpEnabled() {
  return (
    <section className="rounded-xl border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 text-green-600">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h3 className="font-semibold">Two-factor authentication enabled</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Your account is protected with an authenticator app.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <RegenerateRecoveryCodesButton />
          <DisableTotpButton />
        </div>
      </div>
    </section>
  );
}
