import {
  type CreateSubjectPayload,
  type Subject,
  type UpdateSubjectPayload,
} from "../../../entities/subject/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export type SubjectResponse = Omit<Subject, "exam_date"> & {
  exam_date: string | null;
};

export function parseSubject(subject: SubjectResponse): Subject {
  return {
    ...subject,
    exam_date: subject.exam_date ? new Date(subject.exam_date) : null,
  };
}

function serializeSubjectPayload(subject: CreateSubjectPayload | UpdateSubjectPayload) {
  return {
    ...subject,
    exam_date: subject.exam_date instanceof Date ? subject.exam_date.toISOString() : subject.exam_date,
  };
}

export function getSubjects() {
  return request<SubjectResponse[]>("/subjects/").then((subjects) => subjects.map(parseSubject));
}

export function createSubject(subject: CreateSubjectPayload): Promise<Subject[]> {
  return request<SubjectResponse[]>("/subjects/", {
    method: "POST",
    body: JSON.stringify([serializeSubjectPayload(subject)]),
  }).then((subjects) => subjects.map(parseSubject));
}

export function updateSubject(id: number, subject: UpdateSubjectPayload): Promise<Subject> {
  return request<SubjectResponse>(`/subjects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(serializeSubjectPayload(subject)),
  }).then(parseSubject);
}

export function replaceSubject(id: number, subject: CreateSubjectPayload): Promise<Subject> {
  return request<SubjectResponse>(`/subjects/${id}`, {
    method: "PUT",
    body: JSON.stringify(serializeSubjectPayload(subject)),
  }).then(parseSubject);
}
