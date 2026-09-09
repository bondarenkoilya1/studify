import { z } from "zod";

const MAX_FILE_SIZE = 2 << 20; // 2 MB

const VALID_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/x-png",
  "image/webp",
]);

export const avatarFileSchema = z
  .instanceof(File, { message: "Выберите файл изображения" })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "Максимальный размер файла — 2 МБ",
  })
  .refine(
    (file) =>
      ACCEPTED_IMAGE_TYPES.has(file.type.toLowerCase()) ||
      VALID_EXTENSIONS.test(file.name),
    {
      message: "Поддерживаются форматы JPEG, PNG и WebP",
    },
  );

export const avatarUploadSchema = z.object({
  avatar: avatarFileSchema,
});

export type AvatarUploadValues = z.infer<typeof avatarUploadSchema>;
