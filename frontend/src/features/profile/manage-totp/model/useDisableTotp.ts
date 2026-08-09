import { disableTotp } from "../api/disable-totp";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/api";
import { useTotp } from "@/features/profile/manage-totp";

export function useDisableTotp() {
  const { setQrCode, setTextKey } = useTotp();

  return useMutation({
    mutationFn: disableTotp,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      setQrCode("");
      setTextKey("");
    },
  });
}
