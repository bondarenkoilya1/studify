import { createFileRoute } from "@tanstack/react-router";
import { CenteredPage } from "@/shared/ui/centered-page";
import { RegisterForm } from "@/features/register-by-email";

export const Route = createFileRoute("/_guest/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <CenteredPage>
      <RegisterForm />
    </CenteredPage>
  );
}
