import { httpClient } from "@/shared/api";
import type { Subject } from "@/entities/subject";

export function getSubject(id: number) {
  return httpClient.get<Subject>("/api/subjects/" + id);
}
