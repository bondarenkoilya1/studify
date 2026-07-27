import { httpClient } from "@/shared/api";

export const resendEmailConfirmation = async (): Promise<void> => {
  return httpClient.post<void>("/api/auth/confirm/resend");
};
