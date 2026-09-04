import { useMutation } from "@tanstack/react-query";
import { deleteSubject } from "../api/delete-subject";
import { queryClient } from "@/shared/api";

export function useDeleteSubject() {
  return useMutation({
    mutationFn: deleteSubject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });
    },
  });
}
