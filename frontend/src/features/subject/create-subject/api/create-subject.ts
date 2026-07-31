import { httpClient } from "@/shared/api";
import type { SubjectInput } from "@/entities/subject/model/types";

export function createSubject(): Promise<SubjectInput> {
  return httpClient.post<SubjectInput>("/api/subjects/");
}
