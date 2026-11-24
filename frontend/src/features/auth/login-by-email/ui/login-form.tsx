import { useLoginForm } from "../model/use-login-form";
import { LoginCredentialsForm } from "./login-credentials-form";
import { LoginTotpForm } from "./login-totp-form";

export function LoginForm({ confirmToken }: { confirmToken?: string }) {
  const { step, credentials, totp, goBack } = useLoginForm(confirmToken);

  if (step === "totp") {
    return <LoginTotpForm totp={totp} onBack={goBack} />;
  }

  return <LoginCredentialsForm credentials={credentials} />;
}
