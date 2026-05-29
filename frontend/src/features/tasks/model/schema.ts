import { z } from "zod";

export const taskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required"),
  deadline: z.string().min(1, "Deadline is required"),
  status: z.enum(["not_completed", "ongoing", "completed"]),
  subject_id: z.number().min(1, "Subject is required"),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
