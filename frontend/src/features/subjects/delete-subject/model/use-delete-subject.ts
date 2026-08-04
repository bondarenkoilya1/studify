import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSubject } from "../api/delete-subject";

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });
    },
  });
}
