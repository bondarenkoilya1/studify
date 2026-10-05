import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { currentUserQuery } from "@/entities/user";

export const Route = createFileRoute("/_guest")({
  beforeLoad: async function ({ context }) {
    const user = await context.queryClient.ensureQueryData(currentUserQuery);

    if (user) {
      throw redirect({
        to: "/",
      });
    }
  },

  component: () => <Outlet />,
});
