import { httpClient } from "@/shared/api";

export async function logout() {
  await httpClient.post<void>("/api/auth/logout");
  window.location.href = "/";
}
