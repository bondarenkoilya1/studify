import { queryOptions } from "@tanstack/react-query";
import {
  ApiError,
  checkAuthSession,
  getGetCurrentUserQueryKey,
} from "@/shared/api";

export const currentUserQuery = queryOptions({
  // Keep the current-user cache key used by profile mutations.
  queryKey: getGetCurrentUserQueryKey(),
  queryFn: async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const session = await checkAuthSession();
        return session.user ?? null;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) {
          throw error;
        }
        if (attempt < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 150 * (attempt + 1)),
          );
        }
      }
    }
    return null;
  },
});
