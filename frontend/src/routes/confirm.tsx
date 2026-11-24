import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { currentUserQuery } from "@/entities/user";
import {
  ConfirmEmailErrorSection,
  ConfirmEmailPendingSection,
  ConfirmEmailSection,
} from "@/features/profile/confirm-email";
import { ApiError, confirmEmail } from "@/shared/api";
import { RequestError } from "@/shared/ui/page-state";

const confirmEmailSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/confirm")({
  validateSearch: confirmEmailSearchSchema,
  beforeLoad: async ({ context, search }) => {
    if (!search.token) return;

    const user = await context.queryClient.ensureQueryData(currentUserQuery);
    if (!user) {
      throw redirect({
        to: "/login",
        search: { confirmToken: search.token },
        replace: true,
      });
    }
  },
  component: ConfirmEmailRoute,
});

function ConfirmEmailRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  const [savedToken, setSavedToken] = useState(search.token);
  const token = search.token ?? savedToken;

  useEffect(() => {
    if (search.token) {
      setSavedToken(search.token);
      void navigate({ to: "/confirm", search: {}, replace: true });
    }
  }, [search.token, navigate]);

  const confirmation = useQuery({
    queryKey: ["confirm-email", token],
    queryFn: async () => {
      await confirmEmail({ confirm_email_token: token! });
      void queryClient.invalidateQueries({
        queryKey: currentUserQuery.queryKey,
      });
      return true;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  if (!token) return <ConfirmEmailErrorSection />;
  if (confirmation.isPending) return <ConfirmEmailPendingSection />;
  if (confirmation.error) {
    if (
      confirmation.error instanceof ApiError &&
      confirmation.error.status === 400
    ) {
      return <ConfirmEmailErrorSection />;
    }
    return (
      <RequestError
        error={confirmation.error}
        onRetry={() => void confirmation.refetch()}
      />
    );
  }

  return <ConfirmEmailSection />;
}
