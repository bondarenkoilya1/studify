import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createSubject } from "../api/create-subject";
import { createSubjectSchema, type CreateSubjectFormValues } from "./schema";

export function useCreateSubjectForm(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSubject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      onSuccess?.();
    },
  });

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      note: "",
      type: "university",
      scope: "other",
      lecturer: "",
      lecturerAvatarUrl: null,
      examDate: undefined,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      ...values,
      examDate:
        values.type === "university"
          ? values.examDate.toISOString()
          : (values.examDate?.toISOString() ?? null),
      lecturer: values.type === "personal" ? null : values.lecturer,
      lecturerAvatarUrl:
        values.type === "personal" ? null : (values.lecturerAvatarUrl ?? null),
    });
  });

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
