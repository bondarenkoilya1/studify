import { z } from "zod";

const SUBJECT_SCOPES = [
  "technology",
  "healthcare",
  "humanities",
  "business",
  "social",
  "science",
  "other",
] as const;

const baseSubjectSchema = {
  name: z
    .string()
    .trim()
    .min(1, "Укажите название предмета")
    .max(100, "Название слишком длинное"),

  scope: z.enum(SUBJECT_SCOPES, {
    message: "Укажите категорию предмета",
  }),

  lecturerAvatarUrl: z.string().nullable().optional(),
};

export const createSubjectSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseSubjectSchema,
    type: z.literal("university"),

    examDate: z.date({
      message: "Укажите дату экзамена",
    }),

    lecturer: z
      .string()
      .trim()
      .min(1, "Укажите преподавателя")
      .max(100, "Имя преподавателя слишком длинное"),
  }),

  z.object({
    ...baseSubjectSchema,
    type: z.literal("personal"),
    examDate: z.date().optional(),
    lecturer: z.string().nullable().optional(),
  }),
]);

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
