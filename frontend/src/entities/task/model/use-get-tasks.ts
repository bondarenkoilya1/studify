import { useQuery } from "@tanstack/react-query";
import { taskQuery } from "./task-query";

export const useGetTasks = (subjectId: number) =>
  useQuery(taskQuery(subjectId));
