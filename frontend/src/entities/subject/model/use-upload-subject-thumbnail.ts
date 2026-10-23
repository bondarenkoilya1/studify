import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateGetSubject,
  invalidateGetUserSubjects,
  useUploadSubjectThumbnail as useUploadSubjectThumbnailMutation,
} from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useUploadSubjectThumbnail() {
  const queryClient = useQueryClient();

  return useUploadSubjectThumbnailMutation({
    mutation: {
      onSuccess: async (_, { id }) => {
        await Promise.all([
          invalidateGetUserSubjects(queryClient),
          invalidateGetSubject(queryClient, id),
        ]);
        toast.success("Обложка предмета обновлена");
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось загрузить обложку");
      },
    },
  });
}
