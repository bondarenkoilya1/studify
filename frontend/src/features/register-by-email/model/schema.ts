import * as z from "zod";
import { getUTF8Length } from "@/shared/utils";

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email is too long.");

const passwordSchema = z
  .string()
  .refine((value) => getUTF8Length(value) >= 8, {
    message: "Password must be at least 8 characters",
  })
  .refine((value) => getUTF8Length(value) <= 72, {
    message: "Password must be no longer than 72 characters",
  });

export const RegisterByEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterByEmailFormData = z.infer<typeof RegisterByEmailSchema>;
