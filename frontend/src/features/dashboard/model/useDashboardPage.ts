import { useQuery } from "@tanstack/react-query";
import { getDashboardStatus } from "../api/dashboard-api.ts";

export function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

export function useDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStatus,
  });

  const dashboard = dashboardQuery.data;
  const completionPercent = dashboard?.completion_percent ?? 0;
  const overdueCount = dashboard?.overdue_tasks.length ?? 0;
  const nearestTask = dashboard?.nearest_deadline_task;

  return {
    completionPercent,
    dashboard,
    dashboardQuery,
    nearestTask,
    overdueCount,
  };
}
