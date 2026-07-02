import * as z from "zod";

function getUTF8Length(string: string): number {
  return new TextEncoder().encode(string).length;
}

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_.]+$/, {
    message: "Only English letters, numbers, underscores, and dots are allowed",
  })
  .refine((value) => !value.startsWith(".") && !value.endsWith("."), {
    message: "Username cannot start or end with a dot",
  })
  .refine((value) => !value.includes(".."), {
    message: "Username cannot contain two dots in a row",
  });

const passwordSchema = z
  .string()
  .refine((value) => getUTF8Length(value) >= 8, {
    message: "Password must be at least 8 bytes",
  })
  .refine((value) => getUTF8Length(value) <= 72, {
    message: "Password must be at most 72 bytes",
  });

export const RegisterByUsernameSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});
