import { useQueryClient } from "@tanstack/react-query";
import { currentUserQuery } from "@/entities/user";
import { useDisableTOTP } from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useDisableTotp() {
  const queryClient = useQueryClient();

  return useDisableTOTP({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries(currentUserQuery),
      onError: () => toast.error("Failed to disable two-factor authentication."),
    },
  });
}
