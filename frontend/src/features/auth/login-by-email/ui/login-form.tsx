import { useLoginForm } from "../model/use-login-form";
import { LoginCredentialsForm } from "./login-credentials-form";
import { LoginMfaForm } from "./login-mfa-form";

export function LoginForm({ confirmToken }: { confirmToken?: string }) {
  const { needsMfa, credentials, mfa, goBack } = useLoginForm(confirmToken);

  if (needsMfa) {
    return <LoginMfaForm mfa={mfa} onBack={goBack} />;
  }

  return <LoginCredentialsForm credentials={credentials} />;
}
