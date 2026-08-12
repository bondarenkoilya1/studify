import { httpClient } from "@/shared/api";

interface Response {
  codes: string[];
}

export function validateTotp(passcode: string) {
  return httpClient.post<Response>("/api/auth/totp/verify", { passcode });
}
