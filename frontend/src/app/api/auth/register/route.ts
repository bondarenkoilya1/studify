import { NextRequest, NextResponse } from "next/server";
import { goClient } from "@/shared/api/server/go-client";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await goClient.post("/auth/register", JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  const nextResponse = NextResponse.json(data, { status: response.status });

  const setCookies = response.headers.getSetCookie();

  for (const cookie of setCookies) {
    nextResponse.headers.append("Set-Cookie", cookie);
  }

  return nextResponse;
}
