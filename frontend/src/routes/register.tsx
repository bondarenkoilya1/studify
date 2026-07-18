import { createFileRoute } from "@tanstack/react-router";
import { CenteredPage } from "@/shared/ui/centered-page";
import { RegisterForm } from "@/features/register-by-username";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  return (
    <CenteredPage>
      <RegisterForm />
    </CenteredPage>
  );
}
