import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/entities/user/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: getMe,
  });
}
