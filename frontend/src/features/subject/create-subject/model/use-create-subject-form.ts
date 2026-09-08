import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, useForm } from "react-hook-form";

import { ApiError } from "@/shared/api/http/errors";
import { createSubject } from "../api/create-subject";
import { createSubjectSchema, type CreateSubjectFormValues } from "./schema";
import type { SubjectInput } from "@/entities/subject";

const defaultValues: DefaultValues<CreateSubjectFormValues> = {
  name: "",
  note: "",
  type: "university",
  scope: "other",
  course: 1,
  term: 1,
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
  const course = values.course ?? 1;
  const term = values.term ?? 1;

  return {
    name: values.name,
    note: values.note,
    type: values.type,
    scope: values.scope,
    examDate: values.examDate?.toISOString() ?? null,
    term: course * term,
    lecturers: values.lecturers,
    thumbnailUrl: values.lecturerAvatarUrl ?? null,
  };
}

function getSubjectErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось создать предмет. Попробуйте ещё раз.";
}

export function useCreateSubjectForm(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: createSubject,

    onError: (error) => {
      const message = getSubjectErrorMessage(error);
      form.setError("root", { message });
      console.error("Failed to create subject", error);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      form.reset(defaultValues);
      form.clearErrors("root");
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
