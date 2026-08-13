import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";

import { resetPassword } from "@/features/auth/login-by-email/api/reset-password";

export const Route = createFileRoute("/_guest/reset-password/$token")({
  loader: async ({ params }) => {
    await resetPassword(params.token);
    return { success: true };
  },
  pendingComponent: ResetPasswordPendingSection,
  errorComponent: ResetPasswordErrorSection,
  component: ResetPasswordSection,
});

function ResetPasswordSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-studify-background px-4">
      <div className="w-full max-w-md rounded-[20px] border border-studify-border/70 bg-studify-surface p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2
            className="h-7 w-7 text-emerald-500"
            strokeWidth={1.75}
          />
        </div>

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-studify-text">
          Пароль изменён
        </h1>

        <p className="mb-8 text-[15px] leading-relaxed text-studify-muted">
          Ваш пароль успешно сброшен. Теперь вы можете войти в аккаунт,
          используя новый пароль.
        </p>

        <Link
          to="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-studify-primary text-[15px] font-medium text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
        >
          Войти в аккаунт
        </Link>
      </div>
    </div>
  );
}

function ResetPasswordErrorSection() {
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
          новую ссылку для сброса пароля.
        </p>

        <Link
          to="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-studify-primary text-[15px] font-medium text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
        >
          Вернуться ко входу
        </Link>
      </div>
    </div>
  );
}

function ResetPasswordPendingSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-studify-background px-4">
      <div className="w-full max-w-md rounded-[20px] border border-studify-border/70 bg-studify-surface p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-studify-border/60" />

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-studify-text">
          Сбрасываем пароль
        </h1>

        <p className="text-[15px] leading-relaxed text-studify-muted">
          Это займёт всего пару секунд.
        </p>
      </div>
    </div>
  );
}
