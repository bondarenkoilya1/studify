import type { Task } from "@/shared/api";
import { TaskCard } from "@/entities/task/ui/task-card";
import { TaskActions } from "./task-actions";

interface TaskListProps {
  tasks?: Task[];
  focusedTaskId?: number;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  focusedTaskId,
  emptyMessage = "Создайте первую задачу для этого предмета.",
}: TaskListProps) {
  if (!tasks?.length) {
    return (
      <p
        className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
        role="status"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <section aria-label="Задачи предмета" className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          highlighted={task.id === focusedTaskId}
        >
          <TaskActions task={task} />
        </TaskCard>
      ))}
    </section>
  );
}
