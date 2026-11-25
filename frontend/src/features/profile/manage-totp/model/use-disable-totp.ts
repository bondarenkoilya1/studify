import { useQueryClient } from "@tanstack/react-query";
import { currentUserQuery } from "@/entities/user";
import { useDisableTOTP } from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { toast } from "@/shared/ui/sonner";

export function useDisableTotp() {
  const queryClient = useQueryClient();

  const mutation = useDisableTOTP({
    mutation: {
      onSuccess: () => {
        toast.success("Двухфакторная аутентификация отключена.");
        return queryClient.invalidateQueries(currentUserQuery);
      },
    },
  });
  const errorMessage = mutation.error
    ? getRequestErrorMessage(mutation.error, "Не удалось отключить двухфакторную аутентификацию.")
    : null;

  return { ...mutation, errorMessage };
}
