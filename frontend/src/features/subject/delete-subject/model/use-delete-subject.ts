import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSubjectQueryKey,
  getGetSubjectTasksQueryKey,
  invalidateGetDashboardStatus,
  invalidateGetUserSubjects,
  useDeleteSubject as useDeleteSubjectMutation,
} from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useDeleteSubjectMutation({
    mutation: {
      onSuccess: async (_, { id }) => {
        queryClient.removeQueries({ queryKey: getGetSubjectQueryKey(id) });
        queryClient.removeQueries({ queryKey: getGetSubjectTasksQueryKey(id) });

        await Promise.all([
          invalidateGetUserSubjects(queryClient),
          invalidateGetDashboardStatus(queryClient),
        ]);
      },
      onError: () => toast.error("Не удалось удалить предмет"),
    },
  });
}
