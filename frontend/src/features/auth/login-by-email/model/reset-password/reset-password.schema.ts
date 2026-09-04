import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "Введите новый пароль")
      .min(8, "Пароль должен содержать минимум 8 символов"),
    new_password_confirmed: z.string().min(1, "Подтвердите новый пароль"),
  })
  .refine((data) => data.new_password === data.new_password_confirmed, {
    message: "Пароли не совпадают",
    path: ["new_password_confirmed"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
