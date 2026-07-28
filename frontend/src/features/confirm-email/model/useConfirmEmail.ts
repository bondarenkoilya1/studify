import { Route } from "@/routes/_protected/confirm/$token";
import { confirmEmail } from "@/features/confirm-email";

export async function useConfirmEmail() {
  const { token } = Route.useParams();
  await confirmEmail(token);
}
