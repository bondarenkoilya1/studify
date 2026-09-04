import { httpClient } from "@/shared/api";

export interface ResetPasswordParams {
  passwordResetToken: string;
  newPassword: string;
  newPasswordConfirmed: string;
}

export function resetPassword(params: ResetPasswordParams) {
  return httpClient.post<void>("/api/auth/reset-password/", params);
}
