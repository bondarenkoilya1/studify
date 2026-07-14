import { getMe } from "@/shared/api/server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getMe();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(user);
}
