import { httpClient } from "@/shared/api";
import type { Subject, SubjectInput } from "@/entities/subject/model/types";

export function createSubject(data: SubjectInput): Promise<Subject> {
  return httpClient.post<Subject>("/api/subjects/", data);
}
