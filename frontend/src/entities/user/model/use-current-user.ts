import { useQuery } from "@tanstack/react-query";
import { userQuery } from "./user-query";

export const useCurrentUser = () => useQuery(userQuery);
