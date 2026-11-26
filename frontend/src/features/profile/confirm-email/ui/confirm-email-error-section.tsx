import { Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export function ConfirmEmailErrorSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md form-surface text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-7 w-7 text-destructive" strokeWidth={1.75} />
        </div>

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-foreground">
          Ссылка недействительна
        </h1>

        <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
          Срок действия ссылки истёк или она уже была использована. Запросите
          новое письмо для подтверждения почты.
        </p>

        <Link
          to="/"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 active:bg-primary/80"
        >
          Вернуться в приложение
        </Link>
      </div>
    </div>
  );
}
