import { queryOptions } from "@tanstack/react-query";
import { getSubjects } from "../api/get-subjects";

export const subjectQuery = queryOptions({
  queryKey: ["subjects"],
  queryFn: getSubjects,
});
