import type { User } from "@/entities/user";
import { UserRequest } from "@/shared/types";
import { httpClient } from "@/shared/api/client";

export function registerByUsername({ username, password }: UserRequest): Promise<User> {
  return httpClient<User>("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}
