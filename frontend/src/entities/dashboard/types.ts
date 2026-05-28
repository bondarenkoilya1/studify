import { type Task } from "../task/types.ts";

export type DashboardStatus = {
  total_subjects: number;
  total_tasks: number;
  total_completed_tasks: number;
  total_ongoing_tasks: number;
  total_not_completed_tasks: number;
  completion_percent: number;
  nearest_deadline_task: Task | null;
  overdue_tasks: Task[];
};
