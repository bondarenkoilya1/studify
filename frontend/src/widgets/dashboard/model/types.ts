import type { Task } from "@/entities/task";

export interface DashboardStatus {
  totalSubjects: number;
  totalTasks: number;
  totalCompletedTasks: number;
  totalOngoingTasks: number;
  totalNotCompletedTasks: number;
  completionPercent: number;
  nearestDeadlineTask: Task | null;
  overdueTasks: Task[];
}
