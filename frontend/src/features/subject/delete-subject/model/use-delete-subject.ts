import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSubjectQueryKey,
  getGetSubjectTasksQueryKey,
  invalidateGetUserTasks,
  useDeleteSubject as useDeleteSubjectMutation,
} from "@/shared/api";
import { invalidateSubjectData } from "@/entities/subject/model/invalidation";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { toast } from "@/shared/ui/sonner";

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useDeleteSubjectMutation({
    mutation: {
      onSuccess: async (_, { id }) => {
        queryClient.removeQueries({ queryKey: getGetSubjectQueryKey(id) });
        queryClient.removeQueries({ queryKey: getGetSubjectTasksQueryKey(id) });

        await Promise.all([
          invalidateSubjectData(queryClient),
          invalidateGetUserTasks(queryClient),
        ]);
      },
      onError: (error) =>
        toast.error(
          getRequestErrorMessage(error, "Не удалось удалить предмет."),
        ),
    },
  });
}
