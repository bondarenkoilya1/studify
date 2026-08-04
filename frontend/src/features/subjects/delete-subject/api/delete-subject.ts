import { httpClient } from "@/shared/api";

export function deleteSubject({ id }: { id: number }) {
  return httpClient.delete(`/api/subjects/${id}`);
}
