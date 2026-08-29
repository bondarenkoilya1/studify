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

export const LECTURER_POSITION_LABELS: Record<LecturerPosition, string> = {
  lecturer: "Лектор",
  practical_instructor: "Преподаватель практики",
  lab_instructor: "Преподаватель лабораторных",
  assistant: "Ассистент",
};
