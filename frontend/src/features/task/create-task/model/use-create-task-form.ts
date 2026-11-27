import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formatISO, parseISO } from "date-fns";

import {
  addTask,
  getGetTaskQueryKey,
  getGetUserTasksQueryKey,
  updateTask,
  type Task,
  type TaskUpdateRequest,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { invalidateTaskLists } from "@/entities/task/model/invalidation";
import { createTaskSchema, type CreateTaskFormValues } from "./schema";

function dateValue(value: string | null | undefined) {
  return value ? parseISO(value) : null;
}

export function useCreateTaskForm(
  subjectId: number,
  task?: Task,
  onSuccess?: () => void,
  draft?: Partial<CreateTaskFormValues>,
) {
  const queryClient = useQueryClient();
  const defaults: CreateTaskFormValues = {
    subject_id: subjectId,
    name: task?.name ?? "",
    type: task?.type ?? "other",
    description: task?.description ?? "",
    estimated_time: task?.estimated_time ?? null,
    scheduled_date: dateValue(task?.scheduled_date ?? task?.scheduled_at),
    deadline_date: dateValue(task?.deadline_date ?? task?.deadline),
    status: task?.status ?? "not_completed",
    difficulty: task?.difficulty ?? "medium",
    priority: task?.priority ?? "medium",
  };
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { ...defaults, ...draft },
  });
  const { dirtyFields } = form.formState;

  const mutation = useMutation({
    meta: { inlineError: true },
    mutationFn: async ({
      scheduled_date,
      deadline_date,
      ...values
    }: CreateTaskFormValues) => {
      const schedule = scheduled_date
        ? formatISO(scheduled_date, { representation: "date" })
        : null;
      const deadlineDate = deadline_date
        ? formatISO(deadline_date, { representation: "date" })
        : null;

      if (!task) {
        return addTask({
          ...values,
          scheduled_date: schedule,
          deadline_date: deadlineDate,
        });
      }

      const changes: TaskUpdateRequest = {
        name: dirtyFields.name ? values.name : undefined,
        type: dirtyFields.type ? values.type : undefined,
        description: dirtyFields.description ? values.description : undefined,
        estimated_time: dirtyFields.estimated_time
          ? values.estimated_time
          : undefined,
        status: dirtyFields.status ? values.status : undefined,
        difficulty: dirtyFields.difficulty ? values.difficulty : undefined,
        priority: dirtyFields.priority ? values.priority : undefined,
        scheduled_date: dirtyFields.scheduled_date ? schedule : undefined,
        deadline_date: dirtyFields.deadline_date ? deadlineDate : undefined,
      };
      return updateTask(task.id, changes);
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(getGetTaskQueryKey(saved.id), saved);
      if (!task) {
        queryClient.setQueryData<Task[]>(
          getGetUserTasksQueryKey(),
          (tasks) =>
            tasks && [saved, ...tasks.filter(({ id }) => id !== saved.id)],
        );
      }
      await invalidateTaskLists(queryClient, saved.subject_id);
      onSuccess?.();
    },
  });

  return {
    ...form,
    reset: () => {
      form.reset(defaults);
      mutation.reset();
    },
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    error:
      mutation.error &&
      getRequestErrorMessage(
        mutation.error,
        task ? "Не удалось сохранить задачу." : "Не удалось создать задачу.",
        { invalid: "Проверьте поля задачи и даты." },
      ),
  };
}
