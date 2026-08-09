import { httpClient } from "@/shared/api";

export function disableTotp() {
  return httpClient.delete<void>("/api/auth/totp");
}
