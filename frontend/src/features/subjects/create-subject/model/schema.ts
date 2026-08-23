import { z } from "zod";

const baseSubjectSchema = {
  name: z
    .string()
    .trim()
    .min(1, "Укажите название предмета")
    .max(100, "Название слишком длинное"),

  examDate: z.date({
    message: "Укажите дату экзамена",
  }),

  lecturerAvatarUrl: z.string().nullable().optional(),
};

export const createSubjectSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseSubjectSchema,
    type: z.literal("university"),
    lecturer: z
      .string()
      .trim()
      .min(1, "Укажите преподавателя")
      .max(100, "Имя преподавателя слишком длинное"),
  }),

  z.object({
    ...baseSubjectSchema,
    type: z.literal("personal"),
    lecturer: z.string().nullable().optional(),
  }),
]);

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
