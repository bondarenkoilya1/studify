import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./fetcher";

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // 4xx responses will not change on retry; retry network errors and 5xx.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < MAX_RETRIES,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
