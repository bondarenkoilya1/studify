import * as z from "zod";

export const totpSchema = z.object({
  passcode: z
    .string()
    .length(6, "Введите шестизначный код")
    .regex(/^\d+$/, "Введите только цифры"),
});

export type TotpFormData = z.infer<typeof totpSchema>;
