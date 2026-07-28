import { createFileRoute } from "@tanstack/react-router";
import { CenteredPage } from "@/shared/ui/centered-page";
import { LoginForm } from "@/features/login-by-email";

export const Route = createFileRoute("/_guest/login")({ component: LoginPage });

function LoginPage() {
  return (
    <CenteredPage>
      <LoginForm />
    </CenteredPage>
  );
}
