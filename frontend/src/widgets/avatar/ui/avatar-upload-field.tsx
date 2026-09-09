import { useEffect, useState } from "react";
import { Avatar } from "@/widgets/avatar/ui/avatar";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadAvatar = useUploadAvatar();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    const result = avatarUploadSchema.shape.avatar.safeParse(file);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Некорректный файл");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));

    uploadAvatar.mutate(file, {
      onSuccess: resetPreview,
      onError: (err) => {
        resetPreview();
        setError(err.message || "Не удалось обновить аватар");
      },
    });
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Avatar
        email={email}
        avatarUrl={previewUrl ?? currentAvatarUrl}
        size={size}
        disabled={uploadAvatar.isPending}
        loading={uploadAvatar.isPending}
        onFileSelect={handleFileSelect}
      />

      <div className="h-4">
        {error && (
          <span className="text-xs font-medium text-rose-500">{error}</span>
        )}
      </div>
    </div>
  );
}
