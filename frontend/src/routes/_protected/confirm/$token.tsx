import { createFileRoute } from "@tanstack/react-router";
import { useConfirmEmail } from "@/features/confirm-email";

export const Route = createFileRoute("/_protected/confirm/$token")({
  component: RouteComponent,
});

function RouteComponent() {
  useConfirmEmail();

  return <div>Hello "/confirm/$token"!</div>;
}
