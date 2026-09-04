import type {
  TaskDifficulty,
  TaskStatus,
  TaskType,
  TaskPriority,
} from "./types";
import { useGetTasks } from "@/entities/task";
import { TYPE_ORDER } from "@/widgets/task-list/model/model";

interface TaskTypeMetadata {
  type: TaskType;
  count: number;
}

interface TaskMetadata {
  types: TaskTypeMetadata[];
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  difficulties: TaskDifficulty[];
}

export function useTasksMetadata(subjectId: number): TaskMetadata {
  const { data: tasks = [] } = useGetTasks(subjectId);

  const typeCounts = new Map<TaskType, number>();

  for (const task of tasks) {
    typeCounts.set(task.type, (typeCounts.get(task.type) ?? 0) + 1);
  }

  return {
    types: [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .toSorted(
        (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
      ),
    statuses: [...new Set(tasks.map((task) => task.status))],
    priorities: [...new Set(tasks.map((task) => task.priority))],
    difficulties: [...new Set(tasks.map((task) => task.difficulty))],
  };
}
