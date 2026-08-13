import { httpClient } from "@/shared/api";

interface Response {
  qrCode: string;
  textKey: string;
}

export function generateTotp() {
  return httpClient.post<Response>("/api/auth/totp/setup");
}
