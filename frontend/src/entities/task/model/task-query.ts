import { queryOptions } from "@tanstack/react-query";
import { getTasks } from "@/entities/task/api/get-tasks";

export const taskQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: getTasks,
});
