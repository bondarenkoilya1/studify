import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { queryClient } from "@/shared/api";
import { PageError, PageLoader } from "@/shared/ui/page-state";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPendingComponent: PageLoader,
  defaultErrorComponent: PageError,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
