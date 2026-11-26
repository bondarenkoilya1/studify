import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ConfirmEmailSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md form-surface text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2
            className="h-7 w-7 text-emerald-500"
            strokeWidth={1.75}
          />
        </div>

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-foreground">
          Почта подтверждена
        </h1>

        <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
          Ваш адрес электронной почты успешно подтверждён. Теперь вам доступны
          все функции аккаунта.
        </p>

        <Link
          to="/"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 active:bg-primary/80"
        >
          Перейти в приложение
        </Link>
      </div>
    </div>
  );
}
