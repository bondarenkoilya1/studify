import { z } from "zod";

export const createTaskSchema = z.object({
  subjectId: z.number(),

  name: z
    .string()
    .trim()
    .min(1, "Укажите название задачи")
    .max(200, "Название слишком длинное"),

  type: z.enum(["exam", "credit", "coursework", "project", "other"], {
    message: "Укажите тип задачи",
  }),

  description: z.string().trim().max(2000, "Описание слишком длинное"),

  estimatedTime: z
    .number()
    .int()
    .positive("Время должно быть больше 0")
    .nullable(),

  scheduledAt: z.string().nullable(),

  deadline: z.string().nullable(),

  status: z.enum(["not_completed", "ongoing", "completed"], {
    message: "Укажите статус задачи",
  }),

  difficulty: z.enum(["low", "medium", "high"], {
    message: "Укажите сложность задачи",
  }),

  priority: z.enum(["low", "medium", "high"], {
    message: "Укажите приоритет задачи",
  }),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
