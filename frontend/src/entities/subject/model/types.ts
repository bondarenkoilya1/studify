export type SubjectType = "university" | "personal";
export type SubjectScope =
  | "technology"
  | "healthcare"
  | "humanities"
  | "business"
  | "social"
  | "science"
  | "other";
export type LecturerPosition =
  | "lecturer"
  | "practical_instructor"
  | "lab_instructor"
  | "assistant";

export interface Lecturer {
  name: string;
  position: string;
}

export interface Subject {
  id: number;
  userId: number;
  name: string;
  note: string;
  type: SubjectType;
  scope: SubjectScope;
  examDate: string | null;
  lecturers: Lecturer[];
  lecturerAvatarUrl: string | null;
}

export interface SubjectInput {
  name: string;
  note: string;
  type: SubjectType;
  scope: SubjectScope;
  examDate: string | null;
  lecturers: Lecturer[];
  lecturerAvatarUrl: string | null;
}
