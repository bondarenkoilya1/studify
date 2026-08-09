import { ShieldCheck } from "lucide-react";
import { DisableTotpButton } from "@/features/profile/manage-totp/ui/disable-totp-button";

export function TotpEnabled() {
  return (
    <section className="rounded-xl border p-5">
      <div className="flex items-center justify-between gap-4">
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

        <DisableTotpButton />
      </div>
    </section>
  );
}
