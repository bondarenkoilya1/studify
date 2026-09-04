import { queryOptions } from "@tanstack/react-query";
import { getDashboardStatus } from "../api/get-dashboard-status";

export const dashboardStatusQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: getDashboardStatus,
});
