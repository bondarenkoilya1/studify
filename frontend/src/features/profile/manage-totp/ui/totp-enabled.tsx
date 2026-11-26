import { Card } from "@/shared/ui/card";
import { ShieldCheck } from "lucide-react";
import { DisableTotpButton } from "./disable-totp-button";
import { RegenerateRecoveryCodesButton } from "./regenerate-recovery-codes-button";

export function TotpEnabled() {
  return (
    <Card className="rounded-xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 text-green-600">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h3 className="font-semibold">
              Двухфакторная аутентификация включена
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Вход в аккаунт защищён кодом из приложения.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <RegenerateRecoveryCodesButton />
          <DisableTotpButton />
        </div>
      </div>
    </Card>
  );
}
