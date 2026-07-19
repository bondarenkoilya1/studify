import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { userQuery } from "@/entities/user/model/user-query";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async function ({ context }) {
    const user = await context.queryClient.ensureQueryData(userQuery);

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },

  component: () => <Outlet />,
});
