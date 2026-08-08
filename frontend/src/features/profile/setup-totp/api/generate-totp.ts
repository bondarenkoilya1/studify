import { httpClient } from "@/shared/api";

interface Response {
  qrCode: string;
  textKey: string;
}

export function generateTotp() {
  return httpClient.get<Response>("/api/auth/totp");
}
