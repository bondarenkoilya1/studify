import type { Task, TaskType } from "@/shared/api";
import { TYPE_ORDER } from "./presentation";

export interface TaskTypeCount {
  type: TaskType;
  count: number;
}

export function getTaskTypeCounts(tasks: Task[]): TaskTypeCount[] {
  const counts = new Map<TaskType, number>();

  for (const task of tasks) {
    counts.set(task.type, (counts.get(task.type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .toSorted((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
}
