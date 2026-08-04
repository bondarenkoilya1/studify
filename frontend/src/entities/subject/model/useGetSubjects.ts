import { useQuery } from "@tanstack/react-query";
import { subjectQuery } from "./subject-query";

export const useGetSubjects = () => useQuery(subjectQuery);
