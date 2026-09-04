import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/route-tree.gen";
import { queryClient } from "@/shared/api";

export const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
