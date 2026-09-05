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

export const COURSE_OPTIONS = [1, 2] as const;
export const TERM_OPTIONS = [1, 2] as const;

export const COURSE_LABELS: Record<number, string> = {
  1: "1-й курс",
  2: "2-й курс",
};

export const TERM_LABELS: Record<number, string> = {
  1: "1-й term",
  2: "2-й term",
};

export const LECTURER_POSITION_LABELS: Record<LecturerPosition, string> = {
  lecturer: "Лектор",
  practical_instructor: "Преподаватель практики",
  lab_instructor: "Преподаватель лабораторных",
  assistant: "Ассистент",
};
