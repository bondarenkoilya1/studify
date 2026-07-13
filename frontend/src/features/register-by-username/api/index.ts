import type { User } from "@/entities/user";
import { env } from "@/shared/config";
import { UserRequest } from "@/shared/types";
import { httpClient } from "@/shared/api/client";

export function registerByUsername({ username, password }: UserRequest): Promise<User> {
  const url = env.apiBaseUrl + "/api/auth/register";
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  };

  return httpClient<User>(url, options);
}
