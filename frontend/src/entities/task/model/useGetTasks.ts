import { useQuery } from "@tanstack/react-query";
import { taskQuery } from "@/entities/task/model/task-query";

export const useGetTasks = (subjectId: number) =>
  useQuery(taskQuery(subjectId));
