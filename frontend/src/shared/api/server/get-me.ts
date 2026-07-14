import { User } from "@/entities/user";
import { goClient } from "@/shared/api/server/go-client";

export async function getMe(): Promise<User | null> {
  const response = await goClient.get("/auth/me");
  if (!response.ok) {
    return null;
  }

  const user = await response.json();
  return user as User;
}
