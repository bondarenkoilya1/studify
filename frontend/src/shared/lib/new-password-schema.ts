import { z } from "zod";
import { getUTF8Length } from "@/shared/utils";

export function newPasswordSchema(messages: { min: string; max: string }) {
  return z
    .string()
    .refine((value) => Array.from(value).length >= 8, { message: messages.min })
    .refine((value) => getUTF8Length(value) <= 72, { message: messages.max });
}
