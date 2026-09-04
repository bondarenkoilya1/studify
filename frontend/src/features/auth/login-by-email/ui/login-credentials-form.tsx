import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";

import { LoginFormError } from "./login-form-error";
import { LoginFormHeader } from "./login-form-header";
import { ForgotPasswordButton } from "./forgot-password-button";
import { ForgotPasswordDialog } from "./forgot-password-dialog";

type LoginCredentialsFormProps = {
  credentials: {
    registerField: any;
    errors: any;
    isSubmitting: boolean;
    onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  };
};

export function LoginCredentialsForm({
  credentials,
}: LoginCredentialsFormProps) {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <div className="w-full max-w-md text-studify-text">
      <LoginFormHeader
        title="Рады видеть"
        description="Войдите, чтобы продолжить пользоваться Studify."
      />

      <form
        className="rounded-[20px] border border-studify-border/70 bg-studify-surface p-6 shadow-sm sm:p-10"
        onSubmit={credentials.onSubmit}
      >
        <LoginFormError message={credentials.errors.root?.message} />

        <div className="space-y-6 sm:space-y-7">
          <FormField htmlFor="email" label="Эл. почта">
            <Input
              id="email"
              type="email"
              placeholder="octocat@gmail.com"
              autoComplete="email"
              size="lg"
              aria-describedby={
                credentials.errors.email ? "email-error" : undefined
              }
              aria-invalid={Boolean(credentials.errors.email)}
              {...credentials.registerField("email")}
            />

            {credentials.errors.email?.message && (
              <p
                className="mt-1.5 text-[13px] leading-snug text-red-500"
                id="email-error"
              >
                {credentials.errors.email.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="password" label="Пароль">
            <Input
              id="password"
              type="password"
              placeholder="Не менее 8 символов"
              autoComplete="current-password"
              size="lg"
              aria-describedby={
                credentials.errors.password ? "password-error" : undefined
              }
              aria-invalid={Boolean(credentials.errors.password)}
              {...credentials.registerField("password")}
            />

            {credentials.errors.password?.message && (
              <p
                className="mt-1.5 text-[13px] leading-snug text-red-500"
                id="password-error"
              >
                {credentials.errors.password.message}
              </p>
            )}

            <div className="mt-2 flex justify-end">
              <ForgotPasswordButton
                onClick={() => setIsForgotPasswordOpen(true)}
              />
            </div>
          </FormField>

          <Button
            className="h-12 w-full rounded-xl bg-studify-primary text-[15px] font-medium text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
            size="lg"
            disabled={credentials.isSubmitting}
            type="submit"
          >
            {credentials.isSubmitting ? "Входим..." : "Войти"}
          </Button>
        </div>

        <div className="mt-8 text-center text-[13px]">
          <span className="text-studify-muted">Нет аккаунта? </span>

          <Link
            to="/register"
            className="font-medium text-studify-primary transition-colors hover:text-studify-hover"
          >
            Создать аккаунт
          </Link>
        </div>
      </form>

      <ForgotPasswordDialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </div>
  );
}
