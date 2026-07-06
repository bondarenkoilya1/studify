"use client";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { useRegisterForm } from "@/features/register-by-username/model/use-register-form";

export const RegisterForm = () => {
  const { registerField, errors, isSubmitting, onSubmit } = useRegisterForm();

  return (
    <div className="w-full max-w-md">
      <div className="mb-7 flex flex-col items-center sm:mb-9">
        <h1 className="text-center text-3xl font-light tracking-[-0.03em] sm:text-4xl">
          Create your account
        </h1>
        <p className="text-studify-muted mt-3 text-center text-base sm:text-lg">
          Join Studify and start learning.
        </p>
      </div>

      <form
        className="border-studify-border bg-studify-surface shadow-studify-shadow/20 rounded-2xl border p-5 shadow-xl sm:p-8"
        onSubmit={onSubmit}
      >
        <div className="space-y-5 sm:space-y-6">
          <FormField htmlFor="username" label="Username">
            <Input
              id="username"
              type="text"
              placeholder="octocat"
              autoComplete="username"
              controlSize="large"
              aria-describedby={errors.username ? "username-error" : undefined}
              aria-invalid={Boolean(errors.username)}
              {...registerField("username")}
            />
            {errors.username?.message && (
              <p className="mt-2 text-sm text-red-500" id="username-error">
                {errors.username.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="password" label="Password">
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
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

          <Button className="w-full" controlSize="large" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>
    </div>
  );
};
