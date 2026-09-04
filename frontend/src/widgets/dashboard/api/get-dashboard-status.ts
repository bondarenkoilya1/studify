import { httpClient } from "@/shared/api";
import type { DashboardStatus } from "../model/types";

export function getDashboardStatus(): Promise<DashboardStatus> {
  return httpClient.get<DashboardStatus>("/api/dashboard");
}
