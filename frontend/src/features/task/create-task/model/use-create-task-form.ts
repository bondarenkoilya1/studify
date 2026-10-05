import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  invalidateGetDashboardStatus,
  invalidateGetSubjectTasks,
  useAddTask,
} from "@/shared/api";
import { createTaskSchema, type CreateTaskFormValues } from "./schema";

export function useCreateTaskForm(subjectId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useAddTask({
    mutation: {
      onSuccess: async (task) => {
        await Promise.all([
          invalidateGetSubjectTasks(queryClient, task.subject_id),
          invalidateGetDashboardStatus(queryClient),
        ]);

        onSuccess?.();
      },
    },
  });

  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      subject_id: subjectId,

      name: "",
      type: "other",
      description: "",

      estimated_time: null,
      scheduled_at: null,
      deadline: null,

      status: "not_completed",
      difficulty: "medium",
      priority: "medium",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({ data: values });
  });

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
