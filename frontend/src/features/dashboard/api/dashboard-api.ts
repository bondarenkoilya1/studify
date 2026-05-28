import { type DashboardStatus } from "../../../entities/dashboard/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export function getDashboardStatus() {
  return request<DashboardStatus>("/dashboard");
}
