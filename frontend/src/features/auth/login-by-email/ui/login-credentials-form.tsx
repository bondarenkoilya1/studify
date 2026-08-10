import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";

import { LoginFormError } from "./login-form-error";
import { LoginFormHeader } from "./login-form-header";

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
  return (
    <div className="w-full max-w-md text-studify-text">
      <LoginFormHeader
        title="Рады видеть"
        description="Войдите, чтобы продолжить пользоваться Studify."
      />

      <form
        className="rounded-2xl border border-studify-border bg-studify-surface p-5 shadow-xl shadow-studify-shadow/10 sm:p-8"
        onSubmit={credentials.onSubmit}
      >
        <LoginFormError message={credentials.errors.root?.message} />

        <div className="space-y-5 sm:space-y-6">
          <FormField htmlFor="email" label="Эл. почта">
            <Input
              id="email"
              type="email"
              placeholder="octocat@gmail.com"
              autoComplete="email"
              controlSize="large"
              aria-describedby={
                credentials.errors.email ? "email-error" : undefined
              }
              aria-invalid={Boolean(credentials.errors.email)}
              {...credentials.registerField("email")}
            />

            {credentials.errors.email?.message && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
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
              controlSize="large"
              aria-describedby={
                credentials.errors.password ? "password-error" : undefined
              }
              aria-invalid={Boolean(credentials.errors.password)}
              {...credentials.registerField("password")}
            />

            {credentials.errors.password?.message && (
              <p className="mt-2 text-sm text-red-500" id="password-error">
                {credentials.errors.password.message}
              </p>
            )}
          </FormField>

          <Button
            className="w-full bg-studify-primary text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
            controlSize="large"
            disabled={credentials.isSubmitting}
            type="submit"
          >
            {credentials.isSubmitting ? "Входим..." : "Войти"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-studify-muted">Нет аккаунта? </span>

          <Link
            to="/register"
            className="font-medium text-studify-primary transition-colors hover:text-studify-hover hover:underline"
          >
            Создать аккаунт
          </Link>
        </div>
      </form>
    </div>
  );
}
