import * as z from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email is too long.");

const passwordSchema = z.string().min(1, "Password is required");

export const LoginCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const LoginTotpSchema = z.object({
  totpCode: z
    .string()
    .length(6, "TOTP code must be 6 characters")
    .regex(/^\d{6}$/, "TOTP code must contain only numbers"),
});

export type LoginCredentialsFormData = z.infer<typeof LoginCredentialsSchema>;

export type LoginTotpFormData = z.infer<typeof LoginTotpSchema>;
