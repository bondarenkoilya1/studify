import { createFileRoute } from "@tanstack/react-router";
import {
  confirmEmail,
  ConfirmEmailSection,
} from "@/features/auth/confirm-email";
import { queryClient } from "@/shared/api";

export const Route = createFileRoute("/_protected/confirm/$token")({
  loader: async ({ params }) => {
    await confirmEmail(params.token);

    queryClient.setQueryData(["user"], (old) => {
      if (!old) return old;
      return { ...old, is_email_verified: true };
    });

    return { success: true };
  },

  component: ConfirmEmailSection,
});
