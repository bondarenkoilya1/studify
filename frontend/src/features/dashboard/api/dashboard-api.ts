import { type DashboardStatus } from "../../../entities/dashboard/types.ts";
import { request } from "../../../shared/api/http-client.ts";
import { parseTask, type TaskResponse } from "../../tasks/api/tasks-api.ts";

type DashboardStatusResponse = Omit<
  DashboardStatus,
  "nearest_deadline_task" | "overdue_tasks"
> & {
  nearest_deadline_task: TaskResponse | null;
  overdue_tasks: TaskResponse[];
};

export function getDashboardStatus() {
  return request<DashboardStatusResponse>("/dashboard").then((dashboard) => ({
    ...dashboard,
    nearest_deadline_task: dashboard.nearest_deadline_task
      ? parseTask(dashboard.nearest_deadline_task)
      : null,
    overdue_tasks: dashboard.overdue_tasks.map(parseTask),
  }));
}
