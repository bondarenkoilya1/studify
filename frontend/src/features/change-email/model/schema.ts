import * as z from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email is too long.");

export const ChangeEmailSchema = z.object({
  newEmail: emailSchema,
});

export type ChangeEmailFormData = z.infer<typeof ChangeEmailSchema>;
