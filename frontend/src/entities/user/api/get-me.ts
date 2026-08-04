import type { User } from "@/entities/user";
import { httpClient } from "@/shared/api";

export async function getMe(): Promise<User | null> {
  try {
    return await httpClient.get<User>("/api/users/me");
  } catch {
    return null;
  }
}
