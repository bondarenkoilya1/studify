import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, NetworkError } from "./fetcher";
import { getRequestErrorMessage } from "./request-error-message";
import { toast } from "@/shared/ui/sonner";

let onSessionRequired: (() => void) | undefined;

export function setSessionRequiredHandler(handler: () => void) {
  onSessionRequired = handler;
}

function handleMissingSession(error: Error) {
  if (!(error instanceof ApiError) || error.code !== "session_required")
    return false;
  onSessionRequired?.();
  return true;
}

function isServiceFailure(error: Error) {
  return (
    error instanceof NetworkError ||
    (error instanceof ApiError && error.status >= 500)
  );
}

function reportRequestError(error: Error, fallback: string) {
  toast.error(getRequestErrorMessage(error, fallback), {
    id: "api-service-error",
  });
}

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (handleMissingSession(error)) return;
      // Initial route errors have their own error screen.
      if (query.state.data !== undefined && isServiceFailure(error)) {
        reportRequestError(error, "Не удалось обновить данные.");
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _values, _result, mutation) => {
      if (handleMissingSession(error)) return;
      if (
        !mutation.options.onError &&
        !mutation.meta?.inlineError &&
        isServiceFailure(error)
      ) {
        reportRequestError(error, "Не удалось сохранить изменения.");
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 30 * 60 * 1000,
      // 4xx responses will not change on retry; retry network errors and 5xx.
      retry: (failureCount, error) =>
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) && failureCount < MAX_RETRIES,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});
