import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { LoaderCircle, TriangleAlert, WifiOff } from "lucide-react";
import { NetworkError } from "@/shared/api";
import { Button } from "@/shared/ui/button";

export function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
      <LoaderCircle className="size-6 animate-spin" aria-label="Загрузка" />
    </div>
  );
}

export function PageError({ error }: ErrorComponentProps) {
  const router = useRouter();

  const isNetworkError = error instanceof NetworkError;
  const Icon = isNetworkError ? WifiOff : TriangleAlert;
  const message = isNetworkError
    ? "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз."
    : "Что-то пошло не так. Попробуйте ещё раз.";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button type="button" onClick={() => router.invalidate()}>
        Повторить
      </Button>
    </div>
  );
}
