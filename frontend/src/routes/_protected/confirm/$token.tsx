import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/confirm/$token")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/confirm/$token"!</div>;
}
