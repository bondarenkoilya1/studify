import { publicEnv } from "@/shared/config";
import { UnauthorizedError } from "./errors";
import { isPlainObject } from "./is-plain-object";
import { transformKeysCamelToSnake } from "./transform-keys";
import { parseResponse } from "./parse-response";

let refreshTokenPromise: Promise<Response> | null = null;

export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
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
