import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { useRegisterForm } from "../model/use-register-form";
import { Link } from "@tanstack/react-router";

export function RegisterForm() {
  const { registerField, errors, isSubmitting, onSubmit } = useRegisterForm();

  return (
    <div className="w-full max-w-md text-foreground">
      <div className="mb-7 flex flex-col items-center sm:mb-9">
        <h1 className="text-center text-3xl font-light tracking-[-0.03em] sm:text-4xl">
          Создать аккаунт
        </h1>

        <p className="mt-3 text-center text-base text-muted-foreground sm:text-lg">
          Присоединяйтесь к Studify и начните учиться.
        </p>
      </div>

      <form className="form-surface" onSubmit={onSubmit} noValidate>
        {errors.root?.message && (
          <FormError variant="summary" className="mb-4">
            {errors.root.message}
          </FormError>
        )}

        <div className="space-y-5 sm:space-y-6">
          <FormField htmlFor="email" label="Эл. почта">
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              autoComplete="email"
              size="lg"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              {...registerField("email")}
            />

            {errors.email?.message && (
              <FormError id="email-error">{errors.email.message}</FormError>
            )}
          </FormField>

          <FormField htmlFor="password" label="Пароль">
            <Input
              id="password"
              type="password"
              placeholder="Не менее 8 символов"
              autoComplete="new-password"
              size="lg"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(errors.password)}
              {...registerField("password")}
            />

            {errors.password?.message && (
              <FormError id="password-error">
                {errors.password.message}
              </FormError>
            )}
          </FormField>

          <Button
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Создаём..." : "Создать аккаунт"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              to="/login"
              className="font-medium text-studify-primary transition-colors hover:text-studify-hover hover:underline"
            >
              Войти
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
