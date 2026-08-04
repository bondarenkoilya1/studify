type TaskStatus = "not_completed" | "ongoing" | "completed";

export interface Task {
  id: number;
  name: string;
  description: string;
  subjectId: number;
  deadline: string;
  status: TaskStatus;
}

export interface TaskInput {
  name: string;
  description: string;
  subjectId: number;
  deadline: string;
  status: TaskStatus;
}
