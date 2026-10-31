import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSharedProjectQueryKey,
  invalidateGetUserSharedProjects,
  useDeleteSharedProject as useDeleteSharedProjectMutation,
} from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useDeleteSharedProject() {
  const queryClient = useQueryClient();

  return useDeleteSharedProjectMutation({
    mutation: {
      onSuccess: async (_, { id }) => {
        queryClient.removeQueries({
          queryKey: getGetSharedProjectQueryKey(id),
        });
        await invalidateGetUserSharedProjects(queryClient);
        toast.success("Общий предмет удалён");
      },
      onError: () => toast.error("Не удалось удалить общий предмет"),
    },
  });
}
