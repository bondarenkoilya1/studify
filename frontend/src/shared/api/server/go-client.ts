import { cookies } from "next/headers";
import { serverEnv } from "@/shared/config/server-env";

export const goClient = {
  async get(path: string, options?: RequestInit): Promise<Response> {
    const url = createUrl(path);
    const headers = await createHeaders(options?.headers);

    return fetch(url, { ...options, method: "GET", headers });
  },

  async post(path: string, body?: BodyInit, options?: RequestInit): Promise<Response> {
    const url = createUrl(path);
    const headers = await createHeaders(options?.headers);

    return fetch(url, { ...options, method: "POST", headers, body });
  },
};

async function createHeaders(customHeaders?: HeadersInit) {
  const cookieStore = await cookies();

  const headers = new Headers({
    Cookie: cookieStore.toString(),
    Accept: "application/json",
  });

  if (customHeaders) {
    const incoming = new Headers(customHeaders);
    incoming.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function createUrl(path: string) {
  if (!serverEnv.apiBaseUrl) {
    throw new Error("API_INTERNAL_BASE_URL is not set");
  }

  return `${serverEnv.apiBaseUrl}/api/${path.replace(/^\//, "")}`;
}
