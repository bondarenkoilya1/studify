import { useState } from "react";
import { ImageUpload } from "@/shared/ui/image";
import { toAbsoluteUrl } from "@/shared/utils";
import { avatarUploadSchema } from "@/widgets/avatar/model/schema";
import { useUploadAvatar } from "@/widgets/avatar/model/use-upload-avatar";
import { cn } from "@/shared/lib/cn";

interface AvatarUploadFieldProps {
  email: string;
  currentAvatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function AvatarUploadField({
  email,
  currentAvatarUrl,
  size = 96,
  className,
}: AvatarUploadFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const uploadAvatar = useUploadAvatar();

  const handleFileSelect = (file: File) => {
    setError(null);

    const result = avatarUploadSchema.shape.avatar.safeParse(file);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Некорректный файл");
      return;
    }

    uploadAvatar.mutate(file, {
      onError: (err) => {
        setError(err.message || "Не удалось обновить аватар");
      },
    });
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <ImageUpload
        src={currentAvatarUrl}
        resolveUrl={toAbsoluteUrl}
        fallback={email}
        shape="circle"
        size={size}
        alt={`Аватар ${email}`}
        loading={uploadAvatar.isPending}
        disabled={uploadAvatar.isPending}
        containerClassName="bg-transparent border border-border/60 text-foreground"
        onFileSelect={handleFileSelect}
        onFileReject={(reason) => setError(reason)}
      />

      <div className="h-4">
        {error && (
          <span className="text-xs font-medium text-rose-500">{error}</span>
        )}
      </div>
    </div>
  );
}
