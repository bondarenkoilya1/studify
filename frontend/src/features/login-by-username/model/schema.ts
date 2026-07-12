import * as z from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required")
  .max(32, "Invalid username or password.");

const passwordSchema = z.string().min(1, "Password is required");

export const LoginByUsernameSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export type LoginByUsernameFormData = z.infer<typeof LoginByUsernameSchema>;
