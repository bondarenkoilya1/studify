import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Введите эл. почту")
    .email("Введите корректный адрес электронной почты"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
