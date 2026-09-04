import { httpClient } from "@/shared/api";

export function verifyResetPasswordToken(token: string) {
  return httpClient.post<void>("/api/auth/reset-password/verify", {
    passwordResetToken: token,
  });
}
