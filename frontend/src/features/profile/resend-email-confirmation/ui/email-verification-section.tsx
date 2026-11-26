import { useCurrentUser } from "@/entities/user";
import { VerifiedEmailCard } from "./verified-email-card";
import { UnverifiedEmailCard } from "./unverified-email-card";

export function EmailVerificationSection() {
  const { data: user } = useCurrentUser();

  const isVerified = user?.is_email_verified ?? false;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Подтверждение почты</h3>

        {!isVerified && (
          <p className="text-sm text-muted-foreground">
            Подтвердите адрес, чтобы менять почту и подключить 2FA.
          </p>
        )}
      </div>

      {isVerified ? <VerifiedEmailCard /> : <UnverifiedEmailCard />}
    </section>
  );
}
