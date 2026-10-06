import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserQuery } from "@/entities/user";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async function ({ context }) {
    const user = await context.queryClient.ensureQueryData(currentUserQuery);

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },

  component: () => <Outlet />,
});
