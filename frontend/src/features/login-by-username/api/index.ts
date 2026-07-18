import type { UserRequest } from "@/shared/types";
import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api";

export function loginByUsername({
  username,
  password,
}: UserRequest): Promise<User> {
  return httpClient.post<User>("/api/auth/login", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}
