import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateGetDashboardStatus,
  invalidateGetSubject,
  invalidateGetUserSubjects,
} from "@/shared/api";

export function invalidateSubjectData(queryClient: QueryClient, id?: number) {
  const requests = [
    invalidateGetUserSubjects(queryClient),
    invalidateGetDashboardStatus(queryClient),
  ];
  if (id !== undefined) {
    requests.push(invalidateGetSubject(queryClient, id));
  }
  return Promise.all(requests);
}
