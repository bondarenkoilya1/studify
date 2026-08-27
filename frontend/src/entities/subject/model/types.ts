export type SubjectType = "university" | "personal";
export type SubjectScope =
  | "technology"
  | "healthcare"
  | "humanities"
  | "business"
  | "social"
  | "science"
  | "other";

export interface Subject {
  id: number;
  userId: number;
  name: string;
  note: string;
  type: SubjectType;
  scope: SubjectScope;
  examDate: string | null;
  lecturer: string | null;
  lecturerAvatarUrl: string | null;
}

export interface SubjectInput {
  name: string;
  note: string;
  type: SubjectType;
  scope: SubjectScope;
  examDate: string | null;
  lecturer: string | null;
  lecturerAvatarUrl: string | null;
}
