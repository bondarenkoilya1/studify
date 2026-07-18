import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/features/logout-button";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(["user"], null),
    onError: (error) => console.error(error),
  });
}
