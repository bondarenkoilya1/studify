import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { currentUserQuery } from "@/entities/user";
import {
  ConfirmEmailErrorSection,
  ConfirmEmailPendingSection,
  ConfirmEmailSection,
} from "@/features/profile/confirm-email";
import { confirmEmail } from "@/shared/api";

const confirmEmailSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_protected/confirm")({
  validateSearch: confirmEmailSearchSchema,
  component: ConfirmEmailRoute,
});

function ConfirmEmailRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  const [token] = useState<string | null>(() => search.token ?? null);

  useEffect(() => {
    if (search.token) {
      navigate({ to: "/confirm", search: {}, replace: true });
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

  if (!token || confirmation.isError) return <ConfirmEmailErrorSection />;
  if (confirmation.isPending) return <ConfirmEmailPendingSection />;

  return <ConfirmEmailSection />;
}
