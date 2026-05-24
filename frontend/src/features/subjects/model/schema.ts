import { z } from 'zod'

export const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export type SubjectFormValues = z.infer<typeof subjectSchema>
