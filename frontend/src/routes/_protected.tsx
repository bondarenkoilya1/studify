import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserQuery } from "@/entities/user";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async function ({ context, location }) {
    const user = await context.queryClient.ensureQueryData(currentUserQuery);

    if (!user) {
      const subjectId = Number(
        location.pathname.match(/^\/subjects\/(\d+)\/?$/)?.[1],
      );
      const search = new URLSearchParams(location.searchStr);
      const taskId = Number(search.get("task"));
      const subject =
        Number.isSafeInteger(subjectId) && subjectId > 0
          ? subjectId
          : undefined;
      throw redirect({
        to: "/login",
        search: {
          subject,
          task:
            subject && Number.isSafeInteger(taskId) && taskId > 0
              ? taskId
              : undefined,
          event: subject && search.get("event") === "true" ? true : undefined,
        },
      });
    }
  },

  component: () => <Outlet />,
});
