import { createFileRoute } from "@tanstack/react-router";
import { ResendButton } from "@/features/resend-email-confirmation";

export const Route = createFileRoute("/_protected/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SecuritySettings />;
}

function SecuritySettings() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Security settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your email address and account verification.
        </p>
      </div>

      <div className="my-6 border-t" />

      <div className="space-y-6">
        <EmailChangeSection />

        <div className="border-t" />

        <EmailVerificationSection />
      </div>
    </div>
  );
}

function EmailChangeSection() {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Email address</h3>

        <p className="text-sm text-muted-foreground">
          Change the email address associated with your account.
        </p>
      </div>

      <input
        type="email"
        placeholder="Enter new email address"
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
      />

      <div className="flex justify-end">
        <button
          type="button"
          className="h-9 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          Change email
        </button>
      </div>
    </section>
  );
}

function EmailVerificationSection() {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Email verification</h3>

        <p className="text-sm text-muted-foreground">
          Confirm your email address to unlock all account features.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
        <div>
          <p className="text-sm font-medium">Verification email</p>

          <p className="text-sm text-muted-foreground">
            Didn't receive the confirmation email?
          </p>
        </div>

        <ResendButton />
      </div>
    </section>
  );
}
