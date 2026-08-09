import { httpClient } from "@/shared/api";

export function validateTotp(passcode: string) {
  return httpClient.post<void>("/api/auth/totp/verify", { passcode });
}
