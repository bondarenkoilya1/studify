import { User } from "@/entities/user";
import { httpClient } from "@/shared/api/client";
import { UserRequest } from "@/shared/types";

export function loginByUsername({ username, password }: UserRequest): Promise<User> {
  return httpClient<User>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}
