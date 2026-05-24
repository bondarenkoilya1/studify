import { type CreateTaskPayload, type Task } from "../../../entities/task/types.ts";
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
