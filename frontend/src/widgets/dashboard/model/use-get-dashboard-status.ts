import { useQuery } from "@tanstack/react-query";
import { dashboardStatusQuery } from "./dashboard-status-query";

export const useGetDashboardStatus = () => useQuery(dashboardStatusQuery);
