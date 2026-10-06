import { useQuery } from "@tanstack/react-query";
import { currentUserQuery } from "./user-query";

export const useCurrentUser = () => useQuery(currentUserQuery);
