import { User } from "@/entities/user";
import { httpClient } from "@/shared/api/httpClient";
import { env } from "@/shared/config";
import type { UserRequest } from "@/shared/api/auth";

export function loginByUsername({ username, password }: UserRequest): Promise<User> {
  const url = env.apiBaseUrl + "/api/auth/login";
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
