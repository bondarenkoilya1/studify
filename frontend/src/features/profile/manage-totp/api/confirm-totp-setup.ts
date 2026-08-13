import { httpClient } from "@/shared/api";

interface Response {
  codes: string[];
}

export function confirmTotpSetup(passcode: string) {
  return httpClient.post<Response>("/api/auth/totp/setup/confirm", {
    passcode,
  });
}
