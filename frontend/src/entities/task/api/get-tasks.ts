import { httpClient } from "@/shared/api";
import type { Task } from "@/entities/task/model/types";

export function getTasks() {
  return httpClient.get<Task[]>("/api/tasks/");
}
