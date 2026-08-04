import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { createSubject } from "../api/create-subject";
import { createSubjectSchema, type CreateSubjectFormValues } from "./schema";

export function useCreateSubjectForm() {
  const mutation = useMutation({
    mutationFn: createSubject,
  });

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      lecturer: "",
      lecturerAvatarUrl: "",
      examDate: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      ...values,
      examDate: new Date(values.examDate).toISOString(),
    });
  });

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
  };
}
