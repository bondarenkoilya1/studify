import { createFileRoute } from "@tanstack/react-router";
import { CenteredPage } from "@/shared/ui/centered-page";
import { LoginForm } from "@/features/auth/login-by-email";
import { z } from "zod";

export const Route = createFileRoute("/_guest/login")({
  validateSearch: z.object({
    confirmToken: z.string().optional(),
    subject: z.number().int().positive().optional().catch(undefined),
    task: z.number().int().positive().optional().catch(undefined),
    event: z.boolean().optional().catch(undefined),
  }),
  component: LoginPage,
});

function LoginPage() {
  const { confirmToken, subject, task, event } = Route.useSearch();

  return (
    <CenteredPage>
      <LoginForm
        confirmToken={confirmToken}
        subjectId={subject}
        taskId={task}
        subjectEvent={event}
      />
    </CenteredPage>
  );
}
