import { useCurrentUser } from "@/entities/user";
import { VerifiedEmailCard } from "./verified-email-card";
import { UnverifiedEmailCard } from "./unverified-email-card";

export function EmailVerificationSection() {
  const { data: user } = useCurrentUser();

  const isVerified = user?.isEmailVerified ?? false;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Email verification</h3>

        {!isVerified && (
          <p className="text-sm text-muted-foreground">
            Confirm your email address to unlock all account features.
          </p>
        )}
      </div>

      {isVerified ? <VerifiedEmailCard /> : <UnverifiedEmailCard />}
    </section>
  );
}
