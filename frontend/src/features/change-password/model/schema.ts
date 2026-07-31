import * as z from "zod";
import { getUTF8Length } from "@/shared/utils";

const oldPasswordSchema = z.string().min(1, "Password is required");

const newPasswordSchema = z
  .string()
  .refine((value) => getUTF8Length(value) >= 8, {
    message: "Password must be at least 8 characters",
  })
  .refine((value) => getUTF8Length(value) <= 72, {
    message: "Password must be no longer than 72 characters",
  });

export const ChangePasswordSchema = z.object({
  oldPassword: oldPasswordSchema,
  newPassword: newPasswordSchema,
});

export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;
