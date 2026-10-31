import { z } from "zod";

export const createSharedProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Укажите название проекта")
    .max(100, "Название слишком длинное"),

  url: z
    .string()
    .trim()
    .min(1, "Укажите ссылку на проект")
    .url("Введите корректный URL (например, https://github.com/...)")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://"),
      "Ссылка должна начинаться с http:// или https://",
    ),

  author: z
    .string()
    .trim()
    .min(1, "Укажите автора")
    .max(100, "Имя автора слишком длинное"),

  author_avatar_url: z
    .string()
    .trim()
    .url("Введите корректный URL аватарки")
    .or(z.literal(""))
    .optional(),
});

export type CreateSharedProjectFormValues = z.infer<
  typeof createSharedProjectSchema
>;
