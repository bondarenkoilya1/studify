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
      lecturer: "",
      lecturerAvatarUrl: "",
      examDate: undefined as unknown as Date,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const isoDate =
      values.examDate instanceof Date
        ? values.examDate.toISOString()
        : new Date(values.examDate).toISOString();

    mutation.mutate({
      ...values,
      examDate: isoDate,
    });
  });

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
