import { User } from "@/entities/user";
import { env } from "@/shared/config";
import { httpClient } from "@/shared/api/client";
import { UserRequest } from "@/shared/types";

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
