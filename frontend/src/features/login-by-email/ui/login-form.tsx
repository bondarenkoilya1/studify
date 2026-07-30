import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { useLoginForm } from "@/features/login-by-email/model/use-login-form";
import { Link } from "@tanstack/react-router";

export function LoginForm() {
  const { registerField, errors, isSubmitting, onSubmit } = useLoginForm();

  return (
    <div className="w-full max-w-md text-studify-text">
      <div className="mb-7 flex flex-col items-center sm:mb-9">
        <h1 className="text-center text-3xl font-light tracking-[-0.03em] sm:text-4xl">
          Welcome back
        </h1>

        <p className="mt-3 text-center text-base text-studify-muted sm:text-lg">
          Sign in to continue using Studify.
        </p>
      </div>

      <form
        className="rounded-2xl border border-studify-border bg-studify-surface p-5 shadow-xl shadow-studify-shadow/10 sm:p-8"
        onSubmit={onSubmit}
      >
        {errors.root?.message && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {errors.root.message}
          </div>
        )}

        <div className="space-y-5 sm:space-y-6">
          <FormField htmlFor="email" label="Email">
            <Input
              id="email"
              type="text"
              placeholder="octocat@gmail.com"
              autoComplete="email"
              controlSize="large"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              {...registerField("email")}
            />

            {errors.email?.message && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
                {errors.email.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="password" label="Password">
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              controlSize="large"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(errors.password)}
              {...registerField("password")}
            />

            {errors.password?.message && (
              <p className="mt-2 text-sm text-red-500" id="password-error">
                {errors.password.message}
              </p>
            )}
          </FormField>

          <Button
            className="w-full bg-studify-primary text-white hover:bg-studify-hover active:bg-studify-active transition-colors duration-200"
            controlSize="large"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-studify-muted">Don't have an account? </span>

          <Link
            to="/register"
            className="font-medium text-studify-primary transition-colors hover:text-studify-hover hover:underline"
          >
            Create one
          </Link>
        </div>
      </form>
    </div>
  );
}
