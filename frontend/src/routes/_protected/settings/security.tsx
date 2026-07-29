import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MailWarning } from "lucide-react";
import { ResendButton } from "@/features/resend-email-confirmation";
import { useCurrentUser } from "@/entities/user";

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
  const { data: user } = useCurrentUser();

  const verified = user?.is_email_verified ?? false;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Email verification</h3>

        <p className="text-sm text-muted-foreground">
          Confirm your email address to unlock all account features.
        </p>
      </div>

      {verified ? <VerifiedCard /> : <UnverifiedCard />}
    </section>
  );
}

function VerifiedCard() {
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

function UnverifiedCard() {
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

      <ResendButton />
    </div>
  );
}
