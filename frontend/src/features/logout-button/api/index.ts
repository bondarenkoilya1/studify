import { httpClient } from "@/shared/api/client";

export async function logout() {
  await httpClient<void>("/api/auth/logout", { method: "POST" });
  window.localStorage.href = "/";
}
