import type { UserRequest } from "@/shared/types";
import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api";

export function loginByEmail({ email, password }: UserRequest): Promise<User> {
  return httpClient.post<User>("/api/auth/login", {
    email,
    password,
  });
}
