import { publicEnv } from "@/shared/config";

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfter?: number;
  readonly code?: string;

  constructor(
    status: number,
    message: string,
    retryAfter?: number,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.code = code;
  }
}

/** The request never got a response: offline, DNS, CORS or server down. */
export class NetworkError extends ApiError {
  constructor() {
    super(0, "Network error");
    this.name = "NetworkError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", code?: string) {
    super(401, message, undefined, code);
    this.name = "UnauthorizedError";
  }
}

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ApiError && error.status === 401;

// Public auth routes answer 401 for wrong credentials or expired challenges,
// not for an expired session, so they must not trigger a refresh.
const NO_REFRESH_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/session",
];

let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  // Concurrent 401s share one refresh request.
  refreshPromise ??= fetch(`${publicEnv.apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("Content-Type") ?? "";

  return contentType.includes("application/json") ? JSON.parse(text) : text;
}

async function toError(response: Response): Promise<ApiError> {
  const text = (await response.text()).trim();
  let message = text || `Request failed with status ${response.status}`;
  let code: string | undefined;
  if (response.headers.get("Content-Type")?.includes("application/json")) {
    try {
      const body = JSON.parse(text);
      code = typeof body?.code === "string" ? body.code : undefined;
      message =
        typeof body?.message === "string"
          ? body.message
          : typeof body?.error === "string"
            ? body.error
            : message;
    } catch {
      // A broken error response still retains its HTTP status.
    }
  }
  const waitSeconds = Number(response.headers.get("Retry-After"));

  return response.status === 401
    ? new UnauthorizedError(message, code)
    : new ApiError(
        response.status,
        message,
        waitSeconds > 0 && Number.isFinite(waitSeconds)
          ? waitSeconds
          : undefined,
        code,
      );
}

/**
 * Mutator used by the orval-generated client. Sends cookies, refreshes the
 * session once on 401, and throws ApiError for every failed request.
 */
export async function fetcher<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const send = () =>
    fetch(`${publicEnv.apiBaseUrl}${url}`, {
      ...options,
      credentials: "include",
    }).catch((error: unknown) => {
      // Aborts come from React Query cancelling the request; keep them as is.
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      throw new NetworkError();
    });

  let response = await send();

  const canRefresh = !NO_REFRESH_PREFIXES.some(
    (prefix) =>
      url === prefix ||
      url.startsWith(`${prefix}/`) ||
      url.startsWith(`${prefix}?`),
  );

  if (response.status === 401 && canRefresh && (await refreshSession())) {
    response = await send();
  }

  if (!response.ok) {
    throw await toError(response);
  }

  return (await readBody(response)) as T;
}

// Every failed request is thrown as ApiError, whatever the spec declares.
export type ErrorType<_Error> = ApiError;
