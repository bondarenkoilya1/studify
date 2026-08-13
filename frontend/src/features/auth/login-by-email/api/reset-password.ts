import { httpClient } from "@/shared/api";

export function resetPassword(token: string) {
  return httpClient.post<void>("/api/auth/reset-password/" + token);
}
