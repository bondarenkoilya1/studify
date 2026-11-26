import { z } from "zod";
import { newPasswordSchema } from "@/shared/lib/new-password-schema";

export const resetPasswordSchema = z
  .object({
    new_password: newPasswordSchema({
      min: "Пароль должен содержать минимум 8 символов",
      max: "Пароль должен занимать не более 72 байт",
    }),
    new_password_confirmed: z.string().min(1, "Подтвердите новый пароль"),
  })
  .refine((data) => data.new_password === data.new_password_confirmed, {
    message: "Пароли не совпадают",
    path: ["new_password_confirmed"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
