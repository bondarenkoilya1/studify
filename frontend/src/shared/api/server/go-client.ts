import { env } from "@/shared/config";
import { cookies } from "next/headers";

export const goClient = {
  async get(path: string): Promise<Response> {
    if (!env.apiBaseUrl) {
      throw new Error("API_INTERNAL_BASE_URL is not set");
    }

    const url = `${env.apiBaseUrl}/api/${path.replace(/^\//, "")}`;
    const cookieStore = await cookies();

    const headers = new Headers({
      Cookie: cookieStore.toString(),
      Accept: "application/json",
    });

    return fetch(url, { method: "GET", headers });
  },
};
