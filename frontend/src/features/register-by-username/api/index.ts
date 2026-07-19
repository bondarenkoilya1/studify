import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api";
import type { UserRequest } from "@/shared/types";

export function registerByUsername({
  username,
  password,
}: UserRequest): Promise<User> {
  return httpClient.post<User>("/api/auth/register", { username, password });
}
