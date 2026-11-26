import * as z from "zod";
import { newPasswordSchema } from "@/shared/lib/new-password-schema";

const emailSchema = z
  .string()
  .trim()
  .email("Введите корректный адрес почты")
  .max(255, "Адрес почты слишком длинный");

const passwordSchema = newPasswordSchema({
  min: "Пароль должен содержать минимум 8 символов",
  max: "Пароль должен занимать не более 72 байт",
});

export const RegisterByEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterByEmailFormData = z.infer<typeof RegisterByEmailSchema>;
