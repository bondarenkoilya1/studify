import { queryOptions } from "@tanstack/react-query";
import { getMe } from "@/entities/user/api";

export const userQuery = queryOptions({
  queryKey: ["user"],
  queryFn: getMe,
});
