import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form-field";
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
    <div className="w-full max-w-md text-foreground">
      <LoginFormHeader
        title="Рады видеть"
        description="Войдите, чтобы продолжить пользоваться Studify."
      />

      <form className="form-surface" onSubmit={credentials.onSubmit}>
        <LoginFormError message={credentials.errors.root?.message} />

        <div className="space-y-6 sm:space-y-7">
          <FormField htmlFor="email" label="Эл. почта">
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              autoComplete="email"
              size="lg"
              aria-describedby={
                credentials.errors.email ? "email-error" : undefined
              }
              aria-invalid={Boolean(credentials.errors.email)}
              {...credentials.registerField("email")}
            />

            {credentials.errors.email?.message && (
              <FormError id="email-error">
                {credentials.errors.email.message}
              </FormError>
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
              <FormError id="password-error">
                {credentials.errors.password.message}
              </FormError>
            )}

            <div className="mt-2 flex justify-end">
              <ForgotPasswordButton
                onClick={() => setIsForgotPasswordOpen(true)}
              />
            </div>
          </FormField>

          <Button
            className="w-full"
            size="lg"
            disabled={credentials.isSubmitting}
            type="submit"
          >
            {credentials.isSubmitting ? "Входим..." : "Войти"}
          </Button>
        </div>

        <div className="mt-8 text-center text-[13px]">
          <span className="text-muted-foreground">Нет аккаунта? </span>

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
