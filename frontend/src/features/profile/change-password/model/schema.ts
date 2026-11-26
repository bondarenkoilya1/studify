import * as z from "zod";
import { newPasswordSchema } from "@/shared/lib/new-password-schema";

const currentPasswordSchema = z.string().min(1, "Password is required");

export const ChangePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema({
    min: "Password must be at least 8 characters",
    max: "Password must be no longer than 72 bytes",
  }),
});

export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;
