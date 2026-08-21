import type { Task } from "@/entities/task";
import type { TaskType } from "@/entities/task/model/types";

export type TaskTypeFilter = "all" | TaskType;

export function filterTasksByType(
  tasks: Task[] | undefined,
  type: TaskTypeFilter,
): Task[] | undefined {
  if (!tasks || type === "all") {
    return tasks;
  }

  return tasks.filter((task) => task.type === type);
}
