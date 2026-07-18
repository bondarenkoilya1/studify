import { publicEnv } from "@/shared/config";

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const fullURL = `${publicEnv.apiBaseUrl}${url}`;

  const response = await fetch(fullURL, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(url: string, options?: Omit<RequestInit, "method">) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, options?: Omit<RequestInit, "method">) =>
    request<T>(url, { ...options, method: "POST" }),
};
