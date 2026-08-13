import { httpClient } from "@/shared/api";

export function forgotPassword(email: string) {
  return httpClient.post<void>("/api/auth/reset-password", { email });
}
