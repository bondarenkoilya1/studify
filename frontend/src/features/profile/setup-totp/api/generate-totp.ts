import { httpClient } from "@/shared/api";

interface Response {
  qrCode: string;
}

export function generateTotp() {
  return httpClient.get<Response>("/api/auth/totp");
}
