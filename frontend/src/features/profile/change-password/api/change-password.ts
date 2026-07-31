import { httpClient } from "@/shared/api";

export function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  return httpClient.patch<void>("/api/users/me/password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
}
