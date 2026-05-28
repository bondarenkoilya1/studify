import {
  type CreateSubjectPayload,
  type Subject,
  type UpdateSubjectPayload,
} from "../../../entities/subject/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export function getSubjects() {
  return request<Subject[]>("/subjects/");
}

export function createSubject(subject: CreateSubjectPayload) {
  return request<Subject[]>("/subjects/", {
    method: "POST",
    body: JSON.stringify([subject]),
  });
}

export function updateSubject(id: number, subject: UpdateSubjectPayload) {
  return request<Subject>(`/subjects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(subject),
  });
}
