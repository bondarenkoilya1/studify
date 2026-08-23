import { httpClient } from "@/shared/api";
import type { Task } from "@/entities/task/model/types";

export function getTasks(subjectId: number) {
  return httpClient.get<Task[]>(`/api/subjects/${subjectId}/tasks`);
}
