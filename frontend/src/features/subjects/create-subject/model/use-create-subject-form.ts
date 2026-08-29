import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, useForm } from "react-hook-form";

import { createSubject } from "../api/create-subject";
import { createSubjectSchema, type CreateSubjectFormValues } from "./schema";
import type { SubjectInput } from "@/entities/subject";

const defaultValues: DefaultValues<CreateSubjectFormValues> = {
  name: "",
  note: "",
  type: "university",
  scope: "other",
  lecturers: [
    {
      name: "",
      position: "lecturer",
    },
    {
      name: "",
      position: "practical_instructor",
    },
  ],
  lecturerAvatarUrl: null,
  examDate: undefined,
};

function toSubjectInput(values: CreateSubjectFormValues): SubjectInput {
  return {
    name: values.name,
    note: values.note,
    type: values.type,
    scope: values.scope,
    examDate: values.examDate?.toISOString() ?? null,
    lecturers: values.lecturers,
    lecturerAvatarUrl: values.lecturerAvatarUrl ?? null,
  };
}

export function useCreateSubjectForm(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: createSubject,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      form.reset(defaultValues);
      onSuccess?.();
    },
  });

  const submit = form.handleSubmit((values) => {
    mutation.mutate(toSubjectInput(values));
  });

  return {
    ...form,
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
