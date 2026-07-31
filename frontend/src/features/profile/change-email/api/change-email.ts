import { httpClient } from "@/shared/api";
import type { User } from "@/entities/user";

export function changeEmail(newEmail: string): Promise<User> {
  return httpClient.patch<User>("/api/users/me/email", { new_email: newEmail });
}
