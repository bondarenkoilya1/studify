import * as z from "zod";
import { newPasswordSchema } from "@/shared/lib/new-password-schema";

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email is too long.");

const passwordSchema = newPasswordSchema({
  min: "Password must be at least 8 characters",
  max: "Password must be no longer than 72 bytes",
});

export const RegisterByEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterByEmailFormData = z.infer<typeof RegisterByEmailSchema>;
