import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateGetDashboardStatus,
  invalidateGetSubject,
  invalidateGetUserSubjects,
  useUpdateSubject,
} from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useUpdateSubjectEvent(
  subjectId: number,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  const mutation = useUpdateSubject({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          invalidateGetSubject(queryClient, subjectId),
          invalidateGetUserSubjects(queryClient),
          invalidateGetDashboardStatus(queryClient),
        ]);
        toast.success("Событие предмета обновлено");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить событие предмета");
      },
    },
  });

  const updateEvent = (examType: string, examDate: Date | null) => {
    mutation.mutate({
      id: subjectId,
      data: {
        exam_type: examType as
          | "exam"
          | "credit"
          | "coursework"
          | "project"
          | "other",
        exam_date: examDate ? examDate.toISOString() : null,
      },
    });
  };

  return {
    updateEvent,
    isPending: mutation.isPending,
  };
}
