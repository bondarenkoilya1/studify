import { createFileRoute } from "@tanstack/react-router";

import { currentUserQuery } from "@/entities/user";
import {
  ConfirmEmailErrorSection,
  ConfirmEmailPendingSection,
  ConfirmEmailSection,
} from "@/features/profile/confirm-email";
import { confirmEmail } from "@/shared/api";

export const Route = createFileRoute("/_protected/confirm/$token")({
  loader: async ({ context: { queryClient }, params }) => {
    await confirmEmail(params.token);
    await queryClient.invalidateQueries(currentUserQuery);
  },
  pendingComponent: ConfirmEmailPendingSection,
  errorComponent: ConfirmEmailErrorSection,
  component: ConfirmEmailSection,
});
