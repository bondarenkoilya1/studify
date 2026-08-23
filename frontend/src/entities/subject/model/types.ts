export type SubjectType = "university" | "personal";

export interface Subject {
  id: number;
  userId: number;
  name: string;
  type: SubjectType;
  examDate: string | null;
  lecturer: string | null;
  lecturerAvatarUrl: string | null;
}

export interface SubjectInput {
  name: string;
  type: SubjectType;
  examDate: string | null;
  lecturer: string | null;
  lecturerAvatarUrl: string | null;
}
