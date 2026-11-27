import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  addSubject,
  getGetSubjectQueryKey,
  type Subject,
  type SubjectCreateRequest,
  type SubjectUpdateRequest,
  updateSubject,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { invalidateSubjectData } from "@/entities/subject/model/invalidation";
import { createSubjectSchema, type CreateSubjectFormValues } from "./schema";

export function useCreateSubjectForm(
  subject?: Subject,
  onSuccess?: (saved: Subject) => void,
) {
  const queryClient = useQueryClient();
  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: subject?.name ?? "",
      note: subject?.note ?? "",
      type: subject?.type ?? "university",
      scope: subject?.scope ?? "other",
      course: subject?.course ?? null,
      term: subject?.term ?? null,
      examType: subject?.exam_type ?? "exam",
      examDate: subject?.exam_date ? new Date(subject.exam_date) : null,
      lecturers: subject?.lecturers ?? [],
    },
  });
  const { dirtyFields } = form.formState;

  const mutation = useMutation({
    mutationFn: async (values: CreateSubjectFormValues) => {
      const isUniversity = values.type === "university";
      const data: SubjectCreateRequest = {
        name: values.name,
        note: values.note || null,
        type: values.type,
        scope: values.scope,
        exam_type: isUniversity ? values.examType : "other",
        exam_date: isUniversity
          ? (values.examDate?.toISOString() ?? null)
          : null,
        course: values.course ?? null,
        term: values.term ?? null,
        lecturers: isUniversity ? values.lecturers : [],
      };

      if (!subject) return addSubject(data);
      const changes: SubjectUpdateRequest = {
        name: dirtyFields.name ? data.name : undefined,
        note: dirtyFields.note ? data.note : undefined,
        type: dirtyFields.type ? data.type : undefined,
        scope: dirtyFields.scope ? data.scope : undefined,
        exam_type:
          dirtyFields.examType || dirtyFields.type ? data.exam_type : undefined,
        exam_date:
          dirtyFields.examDate || dirtyFields.type ? data.exam_date : undefined,
        course: dirtyFields.course ? data.course : undefined,
        term: dirtyFields.term ? data.term : undefined,
        lecturers:
          isUniversity && dirtyFields.lecturers ? data.lecturers : undefined,
      };
      if (Object.values(changes).every((value) => value === undefined))
        return subject;
      return updateSubject(subject.id, changes);
    },
    onError: (error) => {
      form.setError("root", {
        message: getRequestErrorMessage(
          error,
          subject
            ? "Не удалось сохранить предмет."
            : "Не удалось создать предмет.",
          {
            invalid: "Проверьте данные предмета и список преподавателей.",
            conflict: "Предмет с таким названием уже существует.",
          },
        ),
      });
    },
    onSuccess: async (saved) => {
      if (subject)
        queryClient.setQueryData(getGetSubjectQueryKey(saved.id), saved);
      await invalidateSubjectData(queryClient, saved.id);
      if (!subject) form.reset();
      onSuccess?.(saved);
    },
  });

  const submit = form.handleSubmit((values) => mutation.mutate(values));
  return { ...form, submit, isPending: mutation.isPending };
}
