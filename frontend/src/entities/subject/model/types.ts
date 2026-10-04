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
export type ExamType = "exam" | "credit" | "coursework" | "project" | "other";

export interface Lecturer {
  name: string;
  position: string;
}

export interface File {
  name: string;
  url: string;
  sizeBytes: number;
  contentType: string;
}

export interface Subject {
  id: number;
  userId: number;
  name: string;
  note: string;
  type: SubjectType;
  scope: SubjectScope;
  examDate: string | null;
  examType: ExamType | null;
  course: number | null;
  term: number | null;
  lecturers: Lecturer[];
  thumbnailUrl: string | null;
  files: File[];
}

export interface SubjectInput {
  name: string;
  note: string;
  type: SubjectType;
  scope: SubjectScope;
  examDate: string | null;
  examType: ExamType | null;
  course: number | null;
  term: number | null;
  lecturers: Lecturer[];
  thumbnailUrl: string | null;
}
