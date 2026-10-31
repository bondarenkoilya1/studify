import { z } from "zod";

export const createSharedProjectSchema = z
  .object({
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

    use_profile_name: z.boolean(),

    custom_author: z
      .string()
      .trim()
      .max(100, "Имя автора слишком длинное")
      .optional(),

    use_profile_avatar: z.boolean(),

    custom_avatar_url: z
      .string()
      .trim()
      .url("Введите корректный URL аватарки")
      .or(z.literal(""))
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.use_profile_name) {
      if (!data.custom_author || data.custom_author.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["custom_author"],
          message: "Укажите имя или псевдоним автора",
        });
      }
    }
  });

export type CreateSharedProjectFormValues = z.infer<
  typeof createSharedProjectSchema
>;
