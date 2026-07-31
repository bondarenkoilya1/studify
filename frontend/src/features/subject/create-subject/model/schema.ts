import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Subject name is required")
    .max(100, "Subject name is too long"),

  lecturer: z
    .string()
    .trim()
    .min(1, "Lecturer is required")
    .max(100, "Lecturer name is too long"),

  lecturer_avatar_url: z.string().optional(),

  exam_date: z.string().min(1, "Exam date is required"),
});

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
