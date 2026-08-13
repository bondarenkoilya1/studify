import { Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export function ConfirmEmailErrorSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-studify-background px-4">
      <div className="w-full max-w-md rounded-[20px] border border-studify-border/70 bg-studify-surface p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <XCircle className="h-7 w-7 text-red-500" strokeWidth={1.75} />
        </div>

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-studify-text">
          Ссылка недействительна
        </h1>

        <p className="mb-8 text-[15px] leading-relaxed text-studify-muted">
          Срок действия ссылки истёк или она уже была использована. Запросите
          новое письмо для подтверждения почты.
        </p>

        <Link
          to="/"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-studify-primary text-[15px] font-medium text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
        >
          Вернуться в приложение
        </Link>
      </div>
    </div>
  );
}
