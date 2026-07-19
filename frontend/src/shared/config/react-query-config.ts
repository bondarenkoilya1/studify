import { type QueryClientConfig } from "@tanstack/react-query";
import { UnauthorizedError } from "@/shared/api";

export const reactQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 30, // 30 min
      retry: (failureCount, error: any) => {
        if (
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message.includes("401"))
        ) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
};
