import { useGetTasks } from "@/entities/task";
import type {
  TaskDifficulty,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/entities/task/model/types";

interface TaskMetadata {
  types: TaskType[];
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  difficulties: TaskDifficulty[];
}

export function useTasksMetadata(): TaskMetadata {
  const { data: tasks = [] } = useGetTasks();

  return {
    types: [...new Set(tasks.map((task) => task.type))],
    statuses: [...new Set(tasks.map((task) => task.status))],
    priorities: [...new Set(tasks.map((task) => task.priority))],
    difficulties: [...new Set(tasks.map((task) => task.difficulty))],
  };
}
