import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Укажите корректный адрес почты.")
  .max(254, "Адрес почты слишком длинный.");

export const LoginCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль."),
});

export const LoginTotpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Введите шесть цифр из приложения."),
});

export const LoginRecoverySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^(?:[A-HJ-NP-Z2-9]{12}|[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2})$/,
      "Введите резервный код из 12 символов.",
    ),
});

export type LoginCredentialsFormData = z.infer<typeof LoginCredentialsSchema>;
export type LoginMfaFormData = z.infer<typeof LoginTotpSchema>;
export type LoginMfaMethod = "totp" | "recovery";
