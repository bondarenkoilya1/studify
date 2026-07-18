import { createFileRoute } from "@tanstack/react-router";
import { CenteredPage } from "@/shared/ui/centered-page";
import { LoginForm } from "@/features/login-by-username";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <CenteredPage>
      <LoginForm />
    </CenteredPage>
  );
}
