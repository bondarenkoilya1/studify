import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createTask } from "../api/create-task";
import { createTaskSchema, type CreateTaskFormValues } from "./schema";

export function useCreateTaskForm(subjectId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      onSuccess?.();
    },
  });

  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      subjectId,

      name: "",
      type: "other",
      description: "",

      estimatedTime: null,
      scheduledAt: null,
      deadline: null,

      status: "not_completed",
      difficulty: "medium",
      priority: "medium",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
