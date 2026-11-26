import * as z from "zod";
import { newPasswordSchema } from "@/shared/lib/new-password-schema";

const currentPasswordSchema = z.string().min(1, "Введите текущий пароль");

export const ChangePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema({
    min: "Пароль должен содержать минимум 8 символов",
    max: "Пароль должен занимать не более 72 байт",
  }),
});

export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;
