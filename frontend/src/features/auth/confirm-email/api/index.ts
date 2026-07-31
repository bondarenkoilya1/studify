import { httpClient } from "@/shared/api";

export function confirmEmail(token: string) {
  return httpClient.post<void>("/api/auth/confirm/" + token);
}
