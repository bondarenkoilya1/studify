import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/confirm/$token")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/confirm",
      search: { token: params.token },
      replace: true,
    });
  },
});
