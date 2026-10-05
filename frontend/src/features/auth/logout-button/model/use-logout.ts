import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { endSession } from "@/entities/user";
import { useLogoutUser } from "@/shared/api";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useLogoutUser({
    mutation: {
      // The server clears cookies even on failure, so always end the session.
      onSettled: async () => {
        endSession(queryClient);
        await navigate({ to: "/login" });
      },
    },
  });
}
