import type { QueryClient } from "@tanstack/react-query";
import {
  getGetCalendarQueryKey,
  invalidateGetStudyPlan,
  invalidateGetDashboardStatus,
  invalidateGetSubjectTasks,
  invalidateGetUserTasks,
} from "@/shared/api";

export function invalidateTaskLists(
  queryClient: QueryClient,
  subjectId: number,
) {
  return Promise.all([
    invalidateGetSubjectTasks(queryClient, subjectId),
    invalidateGetUserTasks(queryClient),
    invalidateGetDashboardStatus(queryClient),
    invalidateGetStudyPlan(queryClient),
    queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() }),
  ]);
}
