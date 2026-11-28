import { useLoginForm } from "../model/use-login-form";
import { LoginCredentialsForm } from "./login-credentials-form";
import { LoginMfaForm } from "./login-mfa-form";

export function LoginForm(props: Parameters<typeof useLoginForm>[0]) {
  const { needsMfa, credentials, mfa, goBack } = useLoginForm(props);

  if (needsMfa) {
    return <LoginMfaForm mfa={mfa} onBack={goBack} />;
  }

  return <LoginCredentialsForm credentials={credentials} />;
}
