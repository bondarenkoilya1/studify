import { httpClient } from "@/shared/api";
import type { LoginResponse } from "../model/model";

export function loginByEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });
}
