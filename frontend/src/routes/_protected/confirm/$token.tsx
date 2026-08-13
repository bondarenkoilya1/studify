import { createFileRoute } from "@tanstack/react-router";

import {
  confirmEmail,
  ConfirmEmailErrorSection,
  ConfirmEmailPendingSection,
  ConfirmEmailSection,
} from "@/features/profile/confirm-email";
import { queryClient } from "@/shared/api";

export const Route = createFileRoute("/_protected/confirm/$token")({
  loader: async ({ params }) => {
    await confirmEmail(params.token);

    queryClient.setQueryData(["user"], (old) => {
      if (!old) return old;
      return { ...old, isEmailVerified: true };
    });

    return { success: true };
  },
  pendingComponent: ConfirmEmailPendingSection,
  errorComponent: ConfirmEmailErrorSection,
  component: ConfirmEmailSection,
});
