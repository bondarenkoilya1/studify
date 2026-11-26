import type { QueryClient } from "@tanstack/react-query";
import {
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
  ]);
}
