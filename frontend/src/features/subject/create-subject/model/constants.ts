import type { LecturerPosition } from "@/entities/subject/model/types";

export type CreateSubjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SCOPE_LABELS: Record<string, string> = {
  technology: "Технологии",
  healthcare: "Медицина",
  humanities: "Гуманитарные науки",
  business: "Бизнес",
  social: "Социальные науки",
  science: "Наука",
  other: "Другое",
};

export const SUBJECT_SCOPES = [
  "technology",
  "healthcare",
  "humanities",
  "business",
  "social",
  "science",
  "other",
] as const;

export const LECTURER_POSITIONS = [
  "lecturer",
  "practical_instructor",
  "lab_instructor",
  "assistant",
] as const;

export const COURSE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const TERM_OPTIONS = [1, 2, 3, 4] as const;

export const COURSE_LABELS: Record<number, string> = {
  1: "1-й курс",
  2: "2-й курс",
  3: "3-й курс",
  4: "4-й курс",
  5: "5-й курс",
  6: "6-й курс",
};

export const TERM_LABELS: Record<number, string> = {
  1: "1-й семестр",
  2: "2-й семестр",
  3: "3-й семестр",
  4: "4-й семестр",
};

export const LECTURER_POSITION_LABELS: Record<LecturerPosition, string> = {
  lecturer: "Лектор",
  practical_instructor: "Преподаватель практики",
  lab_instructor: "Преподаватель лабораторных",
  assistant: "Ассистент",
};
