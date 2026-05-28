export type Task = {
  id: number;
  name: string;
  deadline: string;
  status: TaskStatus | string;
  subject_id: number;
};

export type TaskStatus = "not_completed" | "ongoing" | "completed";

export type CreateTaskPayload = Omit<Task, "id">;
export type UpdateTaskPayload = Partial<CreateTaskPayload>;
