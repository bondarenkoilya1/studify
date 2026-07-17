import { cookies } from "next/headers";

export async function hasAccessToken(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get("access_token")?.value;
}
