import { hashKey, type QueryClient } from "@tanstack/react-query";
import type { User } from "@/shared/api";
import { currentUserQuery } from "./user-query";

const currentUserHash = hashKey(currentUserQuery.queryKey);

/**
 * Replaces the cached session: drops every query that belonged to the previous
 * account and updates the current user in place. The user query is updated
 * rather than removed, so mounted observers such as the header re-render.
 */
function replaceSession(queryClient: QueryClient, user: User | null) {
  queryClient.removeQueries({
    predicate: (query) => query.queryHash !== currentUserHash,
  });
  queryClient.setQueryData(currentUserQuery.queryKey, user);
}

/** Stores the user returned by login or registration. */
export function startSession(queryClient: QueryClient, user: User) {
  replaceSession(queryClient, user);
}

/** Marks the visitor as a guest and forgets the previous account's data. */
export function endSession(queryClient: QueryClient) {
  replaceSession(queryClient, null);
}
