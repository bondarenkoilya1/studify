import { httpClient } from "@/shared/api/httpClient";
import type { User } from "@/entities/user";
import type { UserRequest } from "@/shared/api/auth";
import { env } from "@/shared/config";

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
