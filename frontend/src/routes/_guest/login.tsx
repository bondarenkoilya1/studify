import { createFileRoute } from "@tanstack/react-router";
import { CenteredPage } from "@/shared/ui/centered-page";
import { LoginForm } from "@/features/auth/login-by-email";
import { z } from "zod";

export const Route = createFileRoute("/_guest/login")({
  validateSearch: z.object({ confirmToken: z.string().optional() }),
  component: LoginPage,
});

function LoginPage() {
  const { confirmToken } = Route.useSearch();

  return (
    <CenteredPage>
      <LoginForm confirmToken={confirmToken} />
    </CenteredPage>
  );
}
