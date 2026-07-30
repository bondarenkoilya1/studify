import { publicEnv } from "@/shared/config";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

let refreshTokenPromise: Promise<Response> | null = null;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const fullURL = `${publicEnv.apiBaseUrl}${url}`;
  const headers = new Headers(options.headers);
  let body = options.body;

  if (body && isPlainObject(body)) {
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    body = JSON.stringify(body);
  }

  const config: RequestInit = {
    credentials: "include",
    ...options,
    headers,
    body,
  };

  const execute = () => fetch(fullURL, config);
  const response = await execute();

  if (response.status === 401) {
    if (url.includes("/auth/refresh")) {
      throw new UnauthorizedError();
    }

    try {
      if (!refreshTokenPromise) {
        refreshTokenPromise = fetch(
          `${publicEnv.apiBaseUrl}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          },
        );
      }

      const refreshResponse = await refreshTokenPromise;

      if (!refreshResponse.ok) {
        throw new UnauthorizedError();
      }

      const retryResponse = await execute();

      if (!retryResponse.ok) {
        throw new Error(
          `HTTP request failed with status ${retryResponse.status}`,
        );
      }

      return parseResponse<T>(retryResponse);
    } finally {
      refreshTokenPromise = null;
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP request failed with status ${response.status}`);
  }

  return parseResponse<T>(response);
}

export const httpClient = {
  get: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ) => request<T>(url, { ...options, method: "POST", body: body as any }),

  patch: <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ) => request<T>(url, { ...options, method: "PATCH", body: body as any }),
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}
