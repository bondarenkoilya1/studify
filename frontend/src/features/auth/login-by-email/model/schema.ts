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
  totpCode: z
    .string()
    .length(6, "TOTP code must be 6 characters")
    .regex(/^\d{6}$/, "TOTP code must contain only numbers"),
});

export type LoginCredentialsFormData = z.infer<typeof LoginCredentialsSchema>;

export type LoginTotpFormData = z.infer<typeof LoginTotpSchema>;
