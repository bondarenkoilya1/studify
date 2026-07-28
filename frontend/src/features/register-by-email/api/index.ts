import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api";
import type { UserRequest } from "@/shared/types";

export function registerByEmail({
  email,
  password,
}: UserRequest): Promise<User> {
  return httpClient.post<User>("/api/auth/register", { email, password });
}
