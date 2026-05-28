import { type TaskStatus } from "../../entities/task/types.ts";

export const statusLabels: Record<TaskStatus, string> = {
  not_completed: "Not Completed",
  ongoing: "Ongoing",
  completed: "Completed",
};

export const statusClasses: Record<TaskStatus, string> = {
  not_completed: "bg-slate-100 text-slate-700",
  ongoing: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-700",
};

export function getStatusLabel(status: string) {
  return statusLabels[status as TaskStatus] ?? status;
}

export function getStatusClass(status: string) {
  return statusClasses[status as TaskStatus] ?? "bg-slate-100 text-slate-700";
}
