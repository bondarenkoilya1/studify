import * as z from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Введите корректный адрес почты")
  .max(254, "Адрес почты слишком длинный");

export const ChangeEmailSchema = z.object({
  newEmail: emailSchema,
  currentPassword: z.string().min(1, "Введите текущий пароль"),
});

export type ChangeEmailFormData = z.infer<typeof ChangeEmailSchema>;
