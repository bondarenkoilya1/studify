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

/**
 * Converts snake_case keys to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts camelCase keys to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transforms object keys from snake_case to camelCase
 */
function transformKeysSnakeToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(transformKeysSnakeToCamel);
  }

  if (isPlainObject(obj)) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = transformKeysSnakeToCamel(value);
    }
    return transformed;
  }

  return obj;
}

/**
 * Recursively transforms object keys from camelCase to snake_case
 */
function transformKeysCamelToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(transformKeysCamelToSnake);
  }

  if (isPlainObject(obj)) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = transformKeysCamelToSnake(value);
    }
    return transformed;
  }

  return obj;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const fullURL = `${publicEnv.apiBaseUrl}${url}`;
  const headers = new Headers(options.headers);
  let body = options.body;

  if (body && isPlainObject(body)) {
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    // Transform camelCase to snake_case before sending to backend
    const transformedBody = transformKeysCamelToSnake(body);
    body = JSON.stringify(transformedBody);
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
    const data = JSON.parse(text);
    // Transform snake_case to camelCase after receiving from backend
    return transformKeysSnakeToCamel(data) as T;
  } catch {
    return text as unknown as T;
  }
}
