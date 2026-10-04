import { z } from "zod";
import { EXAM_TYPES, LECTURER_POSITIONS, SUBJECT_SCOPES } from "./constants";

const lecturerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Укажите имя преподавателя")
    .max(100, "Имя преподавателя слишком длинное"),
  position: z.enum(LECTURER_POSITIONS, {
    message: "Укажите должность преподавателя",
  }),
});

const baseSubjectSchema = {
  name: z
    .string()
    .trim()
    .min(1, "Укажите название предмета")
    .max(100, "Название слишком длинное"),
  note: z.string().trim().max(200, "Заметка слишком длинная"),
  scope: z.enum(SUBJECT_SCOPES, { message: "Укажите категорию предмета" }),
  course: z
    .number()
    .int("Курс должен быть целым числом")
    .min(1, "Курс должен быть от 1 до 6")
    .max(6, "Курс должен быть от 1 до 6")
    .nullable()
    .optional(),
  term: z
    .number()
    .int("Семестр должен быть целым числом")
    .min(1, "Семестр должен быть от 1 до 4")
    .max(4, "Семестр должен быть от 1 до 4")
    .nullable()
    .optional(),
  lecturerAvatarUrl: z.string().nullable().optional(),
};

export const createSubjectSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseSubjectSchema,
    type: z.literal("university"),
    examDate: z.date({ message: "Укажите дату экзамена" }),
    examType: z.enum(EXAM_TYPES, { message: "Укажите тип экзамена" }),
    lecturers: z
      .array(lecturerSchema)
      .min(1, "Добавьте хотя бы одного преподавателя"),
  }),

  z.object({
    ...baseSubjectSchema,
    type: z.literal("personal"),
    examDate: z.date().optional(),
    examType: z.enum(EXAM_TYPES).optional(),
    lecturers: z.array(lecturerSchema),
  }),
]);

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
