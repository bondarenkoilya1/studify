import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { checkAuthSession, queryClient, type User } from "@/shared/api";
import { currentUserQuery, endSession } from "@/entities/user";
import { setSessionRequiredHandler } from "@/shared/api/query-client";
import { toast } from "@/shared/ui/sonner";
import { PageError, PageLoader } from "@/shared/ui/page-state";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPendingComponent: PageLoader,
  defaultErrorComponent: PageError,
});

let sessionCheck: Promise<void> | undefined;

setSessionRequiredHandler(() => {
  const key = currentUserQuery.queryKey;
  const userId = queryClient.getQueryData<User | null>(key)?.id;
  if (userId === undefined || sessionCheck) return;

  sessionCheck = checkAuthSession()
    .then(async (session) => {
      if (
        session.authenticated ||
        queryClient.getQueryData<User | null>(key)?.id !== userId
      )
        return;
      endSession(queryClient);
      toast.info("Сессия завершилась. Войдите снова.", {
        id: "session-required",
      });
      await router.navigate({ to: "/login", replace: true });
    })
    .catch(() => {
      // A failed check does not establish that the session expired.
    })
    .finally(() => {
      sessionCheck = undefined;
    });
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
