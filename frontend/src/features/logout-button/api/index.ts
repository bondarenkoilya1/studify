import { httpClient } from "@/shared/api";

export function logout() {
  return httpClient.post<void>("/api/logout");
}
