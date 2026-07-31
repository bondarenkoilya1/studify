import { useCurrentUser } from "@/entities/user";

export function ChangeEmailHeader() {
  const { data } = useCurrentUser();

  const isDisabled = !data?.is_email_verified;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Email address</h3>

        {isDisabled && (
          <span className="rounded-full border border-studify-border bg-studify-surface px-2.5 py-1 text-xs font-medium text-studify-muted">
            Verify your current email first
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Change the email address associated with your account.
      </p>
    </div>
  );
}
