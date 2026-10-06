import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, useForm } from "react-hook-form";

import {
  type ApiError,
  invalidateGetDashboardStatus,
  NetworkError,
  invalidateGetUserSubjects,
  type SubjectCreateRequest,
  useAddSubject,
} from "@/shared/api";
import { createSubjectSchema, type CreateSubjectFormValues } from "./schema";

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

function toCreateSubjectRequest(
  values: CreateSubjectFormValues,
): SubjectCreateRequest {
  return {
    name: values.name,
    note: values.note,
    type: values.type,
    scope: values.scope,
    exam_date: values.examDate?.toISOString() ?? null,
    course: values.course ?? 1,
    term: values.term ?? 1,
    lecturers: values.lecturers,
    thumbnail_url: values.lecturerAvatarUrl ?? null,
  };
}

function getSubjectErrorMessage(error: ApiError): string {
  return error instanceof NetworkError
    ? "Не удалось создать предмет. Попробуйте ещё раз."
    : error.message;
}

export function useCreateSubjectForm(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues,
  });

  const mutation = useAddSubject({
    mutation: {
      onError: (error) => {
        form.setError("root", { message: getSubjectErrorMessage(error) });
      },
      onSuccess: async () => {
        await Promise.all([
          invalidateGetUserSubjects(queryClient),
          invalidateGetDashboardStatus(queryClient),
        ]);

        form.reset(defaultValues);
        form.clearErrors("root");
        onSuccess?.();
      },
    },
  });

  const submit = form.handleSubmit((values) => {
    mutation.mutate({ data: toCreateSubjectRequest(values) });
  });

  return {
    ...form,
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
