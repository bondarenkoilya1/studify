import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  lecturer: z.string(),
  exam_date: z.string(),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;
