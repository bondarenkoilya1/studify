import { z } from 'zod'

export const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  due_date: z.string().optional(),
  status: z.enum(['not_completed', 'in_progress', 'completed']),
  subject_id: z.number().min(1, 'Subject is required'),
})

export type TaskFormValues = z.infer<typeof taskSchema>
