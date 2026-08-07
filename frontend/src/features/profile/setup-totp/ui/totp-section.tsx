import { Button } from "@/shared/ui/button";
import { useCurrentUser } from "@/entities/user";
import { useGenerateTotp } from "../model/useGenerateTotp";
import { TotpEnabled } from "./totp-enabled";
import { TotpVerificationForm } from "./totp-verification-form";
import { TotpEmailVerificationRequired } from "./totp-email-verification-required";

export function TotpSection() {
  const { handleGenerate, qrCode } = useGenerateTotp();
  const { data } = useCurrentUser();

  if (!data?.isEmailVerified) {
    return <TotpEmailVerificationRequired />;
  }

  if (data.isTotpEnabled) {
    return <TotpEnabled />;
  }

  return (
    <section className="rounded-xl border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Two-factor authentication</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Protect your account with an authenticator app.
          </p>
        </div>

        {!qrCode && <Button onClick={handleGenerate}>Generate QR Code</Button>}
      </div>

      {qrCode && (
        <div className="mt-6 space-y-4">
          <img
            alt="TOTP QR Code"
            src={`data:image/png;base64,${qrCode}`}
            className="mx-auto size-48 rounded-lg border p-2"
          />

          <TotpVerificationForm />
        </div>
      )}
    </section>
  );
}
