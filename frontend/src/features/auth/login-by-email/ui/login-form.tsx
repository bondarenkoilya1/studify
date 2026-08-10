import { useLoginForm } from "../model/use-login-form";
import { LoginCredentialsForm } from "./login-credentials-form";
import { LoginTotpForm } from "./login-totp-form";

export function LoginForm() {
  const { step, credentials, totp, goBack } = useLoginForm();

  if (step === "totp") {
    return <LoginTotpForm totp={totp} onBack={goBack} />;
  }

  return <LoginCredentialsForm credentials={credentials} />;
}
