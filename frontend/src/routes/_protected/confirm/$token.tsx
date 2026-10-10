import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { currentUserQuery } from "@/entities/user";
import {
  ConfirmEmailErrorSection,
  ConfirmEmailPendingSection,
  ConfirmEmailSection,
} from "@/features/profile/confirm-email";
import { confirmEmail } from "@/shared/api";

export const Route = createFileRoute("/_protected/confirm/$token")({
  loader: async ({ context: { queryClient }, params }) => {
    const token = params.token;

    try {
      await confirmEmail({
        confirm_email_token: token,
      });

      await queryClient.invalidateQueries({
        queryKey: currentUserQuery.queryKey,
      });

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  pendingComponent: ConfirmEmailPendingSection,

  component: ConfirmEmailRoute,
});

function ConfirmEmailRoute() {
  const result = Route.useLoaderData();

  const [urlCleaned, setUrlCleaned] = useState(false);

  if (!urlCleaned && typeof window !== "undefined") {
    window.history.replaceState(window.history.state, "", "/");

    setUrlCleaned(true);
  }

  if (!result.success) {
    return <ConfirmEmailErrorSection />;
  }

  return <ConfirmEmailSection />;
}
