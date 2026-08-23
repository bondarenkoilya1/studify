import { httpClient } from "@/shared/api";
import type { DashboardStatus } from "@/entities/dashboard";

export function getDashboardStatus(): Promise<DashboardStatus> {
  return httpClient.get<DashboardStatus>("/api/dashboard");
}
