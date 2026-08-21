export type TaskType = "exam" | "credit" | "coursework" | "project" | "other";

export type TaskStatus = "not_completed" | "ongoing" | "completed";

export type TaskDifficulty = "low" | "medium" | "high";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  subjectId: number;

  name: string;
  type: TaskType;
  description: string;

  estimatedTime: number | null;
  scheduledAt: string | null;
  deadline: string | null;

  status: TaskStatus;
  difficulty: TaskDifficulty;
  priority: TaskPriority;

  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  subjectId: number;

  name: string;
  type: TaskType;
  description: string;

  estimatedTime: number | null;
  scheduledAt: string | null;
  deadline: string | null;

  status: TaskStatus;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
}
