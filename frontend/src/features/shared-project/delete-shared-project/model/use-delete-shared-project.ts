import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSharedProjectCatalogQueryKey,
  getGetSharedProjectQueryKey,
  invalidateGetUserSharedProjects,
  useDeleteSharedProject as useDeleteSharedProjectMutation,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { toast } from "@/shared/ui/sonner";

export function useDeleteSharedProject() {
  const queryClient = useQueryClient();

  return useDeleteSharedProjectMutation({
    mutation: {
      onSuccess: async (_, { id }) => {
        queryClient.removeQueries({
          queryKey: getGetSharedProjectQueryKey(id),
        });
        await Promise.all([
          invalidateGetUserSharedProjects(queryClient),
          queryClient.invalidateQueries({
            queryKey: getGetSharedProjectCatalogQueryKey(),
          }),
        ]);
        toast.success("Общий предмет удалён");
      },
      onError: (error) =>
        toast.error(
          getRequestErrorMessage(error, "Не удалось удалить общий предмет."),
        ),
    },
  });
}
