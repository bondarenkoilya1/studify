import { ShieldCheck, Smartphone, KeyRound } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { useCurrentUser } from "@/entities/user";
import { useGenerateTOTP } from "@/shared/api";
import { toast } from "@/shared/ui/sonner";
import { TotpEnabled } from "./totp-enabled";
import { TotpEmailVerificationRequired } from "./totp-email-verification-required";
import { CopyButton } from "@/shared/ui/copy-button";
import { TotpSetupConfirmationForm } from "./totp-setup-confirmation-form";

export function TotpSection() {
  const { data } = useCurrentUser();

  if (!data?.is_email_verified) {
    return <TotpEmailVerificationRequired />;
  }

  if (data.is_totp_enabled) {
    return <TotpEnabled />;
  }

  return <TotpSetup />;
}

// Unmounts once TOTP is enabled, which discards the generated secret.
function TotpSetup() {
  const generate = useGenerateTOTP({
    mutation: {
      onError: () => toast.error("Failed to start authenticator setup."),
    },
  });

  const qrCode = generate.data?.qr_code;
  const textKey = generate.data?.text_key;

  const isSetupStarted = Boolean(qrCode || textKey);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-5 border-b px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />

            {!isSetupStarted && (
              <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-card">
                <span className="size-2 rounded-full bg-amber-500" />
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account security
            </p>

            <h3 className="mt-0.5 text-base font-semibold">
              Two-factor authentication
            </h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Require a rotating code from your phone every time you sign in.
            </p>
          </div>
        </div>

        {!isSetupStarted && (
          <Button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="shrink-0"
          >
            <Smartphone className="mr-2 size-4" />
            Set up authenticator
          </Button>
        )}
      </div>

      {isSetupStarted && (
        <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="border-b px-6 py-6 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </span>
              Connect your authenticator
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Scan with an app like Google Authenticator or Authy, or enter the
              key by hand.
            </p>

            {qrCode && (
              <div className="mt-5 flex justify-center">
                <div className="rounded-xl border bg-white p-3 shadow-sm">
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="TOTP QR Code"
                    className="size-40"
                  />
                </div>
              </div>
            )}

            {textKey && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <KeyRound className="size-3.5" />
                  Can't scan? Enter this key manually
                </div>

                <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
                  <code className="min-w-0 flex-1 break-all px-1.5 py-1 font-mono text-sm tracking-wide">
                    {textKey}
                  </code>

                  <CopyButton value={textKey} />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-foreground">
                2
              </span>
              Confirm setup
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter the six-digit code your app is showing right now.
            </p>

            <div className="mt-5">
              <TotpSetupConfirmationForm />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
