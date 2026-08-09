import * as z from "zod";

export const totpSchema = z.object({
  passcode: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Only numbers allowed"),
});

export type TotpFormData = z.infer<typeof totpSchema>;
