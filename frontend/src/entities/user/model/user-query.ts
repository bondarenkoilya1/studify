import { queryOptions } from "@tanstack/react-query";
import {
  getCurrentUser,
  getGetCurrentUserQueryKey,
  isUnauthorizedError,
} from "@/shared/api";

/**
 * Current user, or null for a guest. Only 401 means "not logged in";
 * other failures are thrown so they are not mistaken for a logout.
 */
export const currentUserQuery = queryOptions({
  queryKey: getGetCurrentUserQueryKey(),
  queryFn: async () => {
    try {
      return await getCurrentUser();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return null;
      }

      throw error;
    }
  },
});
