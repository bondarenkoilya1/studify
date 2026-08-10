import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api";

type VerifyLoginTotpRequest = {
  challenge_token: string;
  code: string;
};

export function verifyLoginTotp(data: VerifyLoginTotpRequest): Promise<User> {
  return httpClient.post<User>("/api/auth/login/totp", data);
}
