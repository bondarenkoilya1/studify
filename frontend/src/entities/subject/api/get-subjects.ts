import { httpClient } from "@/shared/api";
import type { Subject } from "@/entities/subject";

export function getSubjects() {
  return httpClient.get<Subject[]>("/api/subjects/");
}
