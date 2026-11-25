import { Controller } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import type { useLoginForm } from "../model/use-login-form";
import { LoginFormError } from "./login-form-error";
import { LoginFormHeader } from "./login-form-header";

type LoginMfaFormProps = {
  mfa: ReturnType<typeof useLoginForm>["mfa"];
  onBack: () => void;
};

const otpSlots = [0, 1, 2, 3, 4, 5];

export function LoginMfaForm({ mfa, onBack }: LoginMfaFormProps) {
  const { method, control, errors, isSubmitting, onSubmit, onMethodChange } =
    mfa;
  const usesRecoveryCode = method === "recovery";
  const label = usesRecoveryCode ? "Резервный код" : "Код аутентификатора";

  return (
    <div className="w-full max-w-md text-studify-text">
      <LoginFormHeader
        title="Подтвердите вход"
        description={
          usesRecoveryCode
            ? "Введите один из сохранённых резервных кодов."
            : "Введите шестизначный код из приложения-аутентификатора."
        }
      />

      <form
        className="space-y-5 rounded-2xl border border-studify-border bg-studify-surface p-5 shadow-xl shadow-studify-shadow/10 sm:p-8"
        onSubmit={onSubmit}
      >
        <LoginFormError message={errors.root?.message} />

        <FormField htmlFor="mfa-code" label={label}>
          <Controller
            name="code"
            control={control}
            render={({ field }) =>
              usesRecoveryCode ? (
                <Input
                  {...field}
                  id="mfa-code"
                  placeholder="XXXX-XXXX-XXXX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={errors.code ? "mfa-code-error" : undefined}
                  aria-invalid={Boolean(errors.code)}
                  autoFocus
                />
              ) : (
                <InputOTP
                  {...field}
                  id="mfa-code"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-describedby={errors.code ? "mfa-code-error" : undefined}
                  aria-invalid={Boolean(errors.code)}
                  autoFocus
                >
                  <InputOTPGroup className="w-full justify-center gap-2">
                    {otpSlots.map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-14 w-12 rounded-lg border-studify-border bg-studify-background text-xl font-semibold sm:h-16 sm:w-14"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )
            }
          />
          {errors.code?.message && (
            <p id="mfa-code-error" className="mt-2 text-sm text-red-500">
              {errors.code.message}
            </p>
          )}
        </FormField>

        <Button
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Проверяем..." : "Продолжить"}
        </Button>

        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="link"
            disabled={isSubmitting}
            onClick={() =>
              onMethodChange(usesRecoveryCode ? "totp" : "recovery")
            }
          >
            {usesRecoveryCode
              ? "Использовать код приложения"
              : "Использовать резервный код"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={onBack}
          >
            Вернуться к вводу пароля
          </Button>
        </div>
      </form>
    </div>
  );
}
