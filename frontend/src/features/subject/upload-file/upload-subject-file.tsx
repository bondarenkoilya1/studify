import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { invalidateGetSubject, useUploadSubjectFile } from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function UploadSubjectFile({ subjectId }: { subjectId: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const upload = useUploadSubjectFile({
    mutation: {
      onSuccess: async () => {
        await invalidateGetSubject(queryClient, subjectId);
        toast.success("Файл добавлен");
      },
      onError: (err) =>
        setError(
          getRequestErrorMessage(err, "Не удалось добавить файл.", {
            invalid: "Файл пуст или повреждён. Выберите другой файл.",
            unsupported: "Можно загрузить только PDF или TXT.",
            tooLarge: "Размер файла не должен превышать 50 МиБ.",
          }),
        ),
    },
  });

  return (
    <div className="mt-3">
      <input
        ref={input}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          setError("");
          if (file.size === 0 || file.size > MAX_FILE_SIZE) {
            setError(
              file.size === 0
                ? "Выберите непустой файл."
                : "Размер файла не должен превышать 50 МиБ.",
            );
            return;
          }
          upload.mutate({ id: subjectId, data: { file } });
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
      >
        <Upload />
        {upload.isPending ? "Загружаем…" : "Добавить файл"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
