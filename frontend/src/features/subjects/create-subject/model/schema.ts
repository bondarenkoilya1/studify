import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Укажите название предмета")
    .max(100, "Название слишком длинное"),

  lecturer: z
    .string()
    .trim()
    .min(1, "Укажите преподавателя")
    .max(100, "Имя преподавателя слишком длинное"),

  lecturerAvatarUrl: z.string().optional(),

  examDate: z.date({
    message: "Укажите дату экзамена",
  }),
});

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
