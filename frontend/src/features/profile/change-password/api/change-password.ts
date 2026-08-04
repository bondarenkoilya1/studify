import { httpClient } from "@/shared/api";

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return httpClient.patch<void>("/api/users/me/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
