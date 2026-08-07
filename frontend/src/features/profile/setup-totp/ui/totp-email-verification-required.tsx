import { ShieldAlert } from "lucide-react";

export function TotpEmailVerificationRequired() {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-5">
      <div className="rounded-full bg-amber-100 p-2">
        <ShieldAlert className="size-5 text-amber-600" />
      </div>

      <div>
        <h3 className="font-semibold">Two-factor authentication unavailable</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Verify your email address before enabling an authenticator app.
        </p>
      </div>
    </div>
  );
}
