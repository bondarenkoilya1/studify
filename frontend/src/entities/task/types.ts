export type Task = {
  id: number;
  name: string;
  deadline: string;
  status: TaskStatus | string;
  subject_id: number;
};

export type TaskStatus = "not_completed" | "in_progress" | "completed";

export type CreateTaskPayload = Omit<Task, "id">;
