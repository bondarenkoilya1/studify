import { Controller } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";

import { LoginFormError } from "./login-form-error";
import { LoginFormHeader } from "./login-form-header";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shd/components/ui/input-otp";

type LoginTotpFormProps = {
  totp: {
    control: any;
    errors: any;
    isSubmitting: boolean;
    onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  };
  onBack: () => void;
};
export function LoginTotpForm({ totp, onBack }: LoginTotpFormProps) {
  return (
    <div className="w-full max-w-md text-studify-text">
      <LoginFormHeader
        title="Подтвердите вход"
        description="Введите шестизначный код из приложения для двухфакторной аутентификации."
      />

      <form
        className="rounded-2xl border border-studify-border bg-studify-surface p-5 shadow-xl shadow-studify-shadow/10 sm:p-8"
        onSubmit={totp.onSubmit}
      >
        <LoginFormError message={totp.errors.root?.message} />

        <div className="space-y-5">
          <FormField htmlFor="totpCode" label="Код аутентификатора">
            <Controller
              name="totpCode"
              control={totp.control}
              render={({ field }) => (
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                >
                  <InputOTPGroup className="w-full justify-center gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-14 w-12 rounded-lg border-studify-border bg-studify-background text-xl font-semibold sm:h-16 sm:w-14"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />

            {totp.errors.totpCode?.message && (
              <p className="mt-2 text-sm text-red-500">
                {totp.errors.totpCode.message}
              </p>
            )}
          </FormField>

          <Button
            className="w-full bg-studify-primary text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
            controlSize="large"
            disabled={totp.isSubmitting}
            type="submit"
          >
            {totp.isSubmitting ? "Проверяем..." : "Продолжить"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={onBack}
            className="font-medium text-studify-primary transition-colors hover:text-studify-hover hover:underline"
          >
            Вернуться назад
          </button>
        </div>
      </form>
    </div>
  );
}
