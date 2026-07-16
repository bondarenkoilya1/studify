import { goClient } from "@/shared/api/server/go-client";

export async function POST() {
  const response = await goClient.post("/logout");

  const nextResponse = new Response(null, { status: 204 });

  const cookies = response.headers.getSetCookie();

  for (const cookie of cookies) {
    nextResponse.headers.append("Set-Cookie", cookie);
  }

  return nextResponse;
}
