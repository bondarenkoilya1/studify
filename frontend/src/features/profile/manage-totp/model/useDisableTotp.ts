import { disableTotp } from "../api/disable-totp";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/api";

export function useDisableTotp() {
  return useMutation({
    mutationFn: disableTotp,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });
}
