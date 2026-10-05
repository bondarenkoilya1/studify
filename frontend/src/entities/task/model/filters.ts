import type { Task, TaskType } from "@/shared/api";

export type TaskTypeFilter = "all" | TaskType;

export function filterTasksByType(
  tasks: Task[],
  type: TaskTypeFilter,
): Task[] {
  if (type === "all") {
    return tasks;
  }

  return tasks.filter((task) => task.type === type);
}
