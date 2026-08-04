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
      lecturer_avatar_url: "",
      exam_date: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      ...values,
      exam_date: new Date(values.exam_date).toISOString(),
    });
  });

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
  };
}
