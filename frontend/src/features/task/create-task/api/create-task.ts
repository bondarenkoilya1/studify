import { httpClient } from "@/shared/api";
import type { Task, TaskInput } from "@/entities/task";

export function createTask(data: TaskInput): Promise<Task> {
  return httpClient.post<Task>("/api/tasks/", data);
}
