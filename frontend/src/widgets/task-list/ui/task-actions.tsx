import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  getGetTaskQueryKey,
  type Task,
  type TaskStatus,
  useDeleteTask,
  useUpdateTask,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { STATUS_CONFIG } from "@/entities/task/model/presentation";
import { invalidateTaskLists } from "@/entities/task/model/invalidation";
import { CreateTaskDialog } from "@/features/task/create-task/ui/create-task-dialog";
import { Button } from "@/shared/ui/button";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { toast } from "@/shared/ui/sonner";

export function TaskActions({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const status = useUpdateTask({
    mutation: {
      onSuccess: async (saved) => {
        queryClient.setQueryData(getGetTaskQueryKey(saved.id), saved);
        await invalidateTaskLists(queryClient, task.subject_id);
      },
      onError: (error) =>
        toast.error(
          getRequestErrorMessage(error, "Не удалось изменить статус."),
        ),
    },
  });
  const removal = useDeleteTask({
    mutation: {
      onSuccess: async () => {
        queryClient.removeQueries({ queryKey: getGetTaskQueryKey(task.id) });
        setDeleting(false);
        await invalidateTaskLists(queryClient, task.subject_id);
        toast.success("Задача удалена");
      },
      onError: (error) =>
        toast.error(
          getRequestErrorMessage(error, "Не удалось удалить задачу."),
        ),
    },
  });

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <select
        aria-label={`Статус задачи «${task.name}»`}
        value={
          status.isPending
            ? (status.variables?.data.status ?? task.status)
            : task.status
        }
        disabled={status.isPending}
        onChange={(event) =>
          status.mutate({
            id: task.id,
            data: { status: event.target.value as TaskStatus },
          })
        }
        className="form-control w-auto"
      >
        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={`Редактировать задачу «${task.name}»`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={`Удалить задачу «${task.name}»`}
          onClick={() => setDeleting(true)}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </div>
      {editing && (
        <CreateTaskDialog
          open
          task={task}
          subjectId={task.subject_id}
          onOpenChange={setEditing}
        />
      )}
      <ConfirmDeleteDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Удалить задачу?"
        description={`Задача «${task.name}» будет удалена из предмета.`}
        onConfirm={() => removal.mutate({ id: task.id })}
        isPending={removal.isPending}
      />
    </div>
  );
}
