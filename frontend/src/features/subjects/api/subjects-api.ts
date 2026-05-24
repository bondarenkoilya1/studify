import {
  type CreateSubjectPayload,
  type Subject,
} from '../../../entities/subject/types.ts'
import { request } from '../../../shared/api/http-client.ts'

export function getSubjects() {
  return request<Subject[]>('/subjects/')
}

export function createSubject(subject: CreateSubjectPayload) {
  return request<Subject[]>('/subjects/', {
    method: 'POST',
    body: JSON.stringify([subject]),
  })
}
