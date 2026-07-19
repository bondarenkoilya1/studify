import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { userQuery } from "@/entities/user/model/user-query";

export const Route = createFileRoute("/_guest")({
  beforeLoad: async function ({ context }) {
    const user = await context.queryClient.ensureQueryData(userQuery);

    if (user) {
      throw redirect({
        to: "/",
      });
    }
  },

  component: () => <Outlet />,
});
