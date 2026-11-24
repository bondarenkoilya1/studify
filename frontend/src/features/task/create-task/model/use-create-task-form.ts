import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { endOfDay, formatISO } from "date-fns";

import {
  invalidateGetDashboardStatus,
  invalidateGetSubjectTasks,
  invalidateGetUserTasks,
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
          invalidateGetUserTasks(queryClient),
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
      scheduled_date: null,
      deadline_date: null,

      status: "not_completed",
      difficulty: "medium",
      priority: "medium",
    },
  });

  const onSubmit = form.handleSubmit(
    ({ scheduled_date, deadline_date, ...values }) => {
      mutation.mutate({
        data: {
          ...values,
          scheduled_date: scheduled_date
            ? formatISO(scheduled_date, { representation: "date" })
            : null,
          deadline_date: deadline_date
            ? formatISO(deadline_date, { representation: "date" })
            : null,
          deadline: deadline_date
            ? endOfDay(deadline_date).toISOString()
            : null,
        },
      });
    },
  );

  return {
    ...form,
    onSubmit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
