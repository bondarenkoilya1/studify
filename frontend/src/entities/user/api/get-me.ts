import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api/http-client";

export async function getMe(): Promise<User | null> {
  try {
    return await httpClient.get<User>("/api/auth/me");
  } catch {
    return null;
  }
}
