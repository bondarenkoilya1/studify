import { publicEnv } from "@/shared/config";
import { ApiError, UnauthorizedError } from "./errors";
import { isPlainObject } from "./is-plain-object";
import { transformKeysCamelToSnake } from "./transform-keys";
import { parseResponse } from "./parse-response";

let refreshTokenPromise: Promise<Response> | null = null;

async function getErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `HTTP request failed with status ${response.status}`;
  }

  try {
    const data = JSON.parse(text);

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return String(data.errors[0]);
    }
  } catch {
    // Fallback to raw text for non-JSON responses.
  }

  return text;
}

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
        const message = await getErrorMessage(retryResponse);
        throw new ApiError(retryResponse.status, message);
      }

      return parseResponse<T>(retryResponse);
    } finally {
      refreshTokenPromise = null;
    }
  }

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return parseResponse<T>(response);
}
