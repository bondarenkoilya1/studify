import { User } from "@/entities/user";
import { cookies } from "next/headers";

export async function getMe(): Promise<User | null> {
  const apiInternalBaseUrl = process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, "");
  if (!apiInternalBaseUrl) throw new Error("API_INTERNAL_BASE_URL is not set");
  const url = `${apiInternalBaseUrl}/api/auth/me`;

  const cookieStore = await cookies();
  const options: RequestInit = {
    credentials: "include",
    method: "GET",
    headers: {
      Cookie: cookieStore.toString(),
      Accept: "application/json",
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    return null;
  }

  return response.json();
}
