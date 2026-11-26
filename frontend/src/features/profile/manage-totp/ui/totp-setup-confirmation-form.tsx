import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { useConfirmTOTPSetupForm } from "../model/use-confirm-totp-setup-form";
import { RecoveryCodesDialog } from "./recovery-codes-dialog";

export function TotpSetupConfirmationForm() {
  const {
    register,
    onSubmit,
    recoveryCodes,
    errors,
    isPending,
    isSuccess,
    closeRecoveryCodes,
  } = useConfirmTOTPSetupForm();

  return (
    <>
      {!isSuccess && (
        <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3">
          <FormField htmlFor="totp-setup-code" label="Код аутентификатора">
            <Input
              id="totp-setup-code"
              autoComplete="one-time-code"
              aria-invalid={Boolean(errors.passcode)}
              aria-describedby={
                errors.passcode ? "totp-setup-error" : undefined
              }
              {...register("passcode")}
              placeholder="Код аутентификатора"
              inputMode="numeric"
              type="text"
              maxLength={6}
            />

            {errors.passcode && (
              <p
                id="totp-setup-error"
                className="mt-2 text-sm text-destructive"
              >
                {errors.passcode.message}
              </p>
            )}
          </FormField>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Проверяем…" : "Подтвердить"}
          </Button>
        </form>
      )}

      <RecoveryCodesDialog
        open={isSuccess}
        codes={recoveryCodes}
        onOpenChange={closeRecoveryCodes}
      />
    </>
  );
}
