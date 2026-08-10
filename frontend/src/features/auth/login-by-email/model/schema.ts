import * as z from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email is too long.");

const passwordSchema = z.string().min(1, "Password is required");

export const LoginByEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  totpCode: z.string().refine((value) => value === "" || value.length === 6, {
    message: "TOTP code must be 6 characters",
  }),
});

export type LoginByEmailFormData = z.infer<typeof LoginByEmailSchema>;
