import {
  type CreateTaskPayload,
  type Task,
  type UpdateTaskPayload,
} from "../../../entities/task/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export type TaskResponse = Omit<Task, "deadline"> & {
  deadline: string | null;
};

export function parseTask(task: TaskResponse): Task {
  return {
    ...task,
    deadline: task.deadline ? new Date(task.deadline) : null,
  };
}

function serializeTaskPayload(task: CreateTaskPayload | UpdateTaskPayload) {
  return {
    ...task,
    deadline: task.deadline instanceof Date ? task.deadline.toISOString() : task.deadline,
  };
}

export function getTasks() {
  return request<TaskResponse[]>("/tasks/").then((tasks) => tasks.map(parseTask));
}

export function createTask(task: CreateTaskPayload): Promise<Task[]> {
  return request<TaskResponse[]>("/tasks/", {
    method: "POST",
    body: JSON.stringify([serializeTaskPayload(task)]),
  }).then((tasks) => tasks.map(parseTask));
}

export function updateTask(id: number, task: UpdateTaskPayload): Promise<Task> {
  return request<TaskResponse>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(serializeTaskPayload(task)),
  }).then(parseTask);
}
