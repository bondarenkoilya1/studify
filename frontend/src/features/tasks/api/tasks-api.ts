import {
  type CreateTaskPayload,
  type Task,
  type UpdateTaskPayload,
} from "../../../entities/task/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export function getTasks() {
  return request<Task[]>("/tasks/");
}

export function createTask(task: CreateTaskPayload) {
  return request<Task[]>("/tasks/", {
    method: "POST",
    body: JSON.stringify([task]),
  });
}

export function updateTask(id: number, task: UpdateTaskPayload) {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(task),
  });
}
