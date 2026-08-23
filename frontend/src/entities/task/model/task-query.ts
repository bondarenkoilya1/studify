import { queryOptions } from "@tanstack/react-query";
import { getTasks } from "@/entities/task/api/get-tasks";

export const taskQuery = (subjectId: number) =>
  queryOptions({
    queryKey: ["tasks", subjectId],
    queryFn: () => getTasks(subjectId),
  });
