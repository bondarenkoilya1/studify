import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";

import { verifyResetPasswordToken } from "@/shared/api";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useResetPassword } from "@/features/auth/login-by-email/model/reset-password/use-reset-password";

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  // Сохраняем токен во внутреннее состояние
  const [token, _] = useState<string | null>(() => search.token ?? null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Мгновенная очистка URL от токена при входе (согласно гайду)
  useEffect(() => {
    if (search.token) {
      navigate({
        to: "/reset-password",
        search: {},
        replace: true,
      });
    }
  }, [search.token, navigate]);

  const verification = useQuery({
    queryKey: ["reset-password-token", token],
    queryFn: async () => {
      await verifyResetPasswordToken({
        password_reset_token: token!,
      });
      return true;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  const isValidating = Boolean(token) && verification.isPending;
  const isValid = verification.isSuccess;

  const {
    register,
    formState: { errors },
    submit,
    isSubmitting,
  } = useResetPassword(token ?? "", () => setIsSuccess(true));

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-studify-muted">Проверка ссылки...</p>
      </div>
    );
  }

  if (!isValid || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold">Ссылка недействительна</h1>
          <p className="text-sm text-studify-muted">
            Срок действия ссылки истёк или она уже была использована.
          </p>
          <Link
            to="/login"
            className="inline-block text-studify-primary hover:underline"
          >
            Вернуться ко входу
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-semibold">Пароль изменён</h1>
          <Link
            to="/login"
            className="inline-block text-studify-primary hover:underline"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="max-w-md w-full space-y-4">
        <FormField htmlFor="new_password" label="Новый пароль">
          <Input
            id="new_password"
            type="password"
            {...register("new_password")}
          />
          {errors.new_password?.message && (
            <p className="text-xs text-red-500">
              {errors.new_password.message}
            </p>
          )}
        </FormField>
        <FormField htmlFor="new_password_confirmed" label="Повторите пароль">
          <Input
            id="new_password_confirmed"
            type="password"
            {...register("new_password_confirmed")}
          />
          {errors.new_password_confirmed?.message && (
            <p className="text-xs text-red-500">
              {errors.new_password_confirmed.message}
            </p>
          )}
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Сохраняем..." : "Сменить пароль"}
        </Button>
      </form>
    </div>
  );
}
