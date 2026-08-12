import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useValidateTotpForm } from "../model/useValidateTotpForm";
import { RecoveryCodesDialog } from "./recovery-codes-dialog";

export function TotpVerificationForm() {
  const {
    register,
    onSubmit,
    recoveryCodes,
    errors,
    isPending,
    isSuccess,
    closeRecoveryCodes,
  } = useValidateTotpForm();

  return (
    <>
      {!isSuccess && (
        <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3">
          <div className="space-y-2">
            <Input
              {...register("passcode")}
              placeholder="Auth passcode"
              inputMode="numeric"
              type="text"
              maxLength={6}
            />

            {errors.passcode && (
              <p className="text-sm text-destructive">
                {errors.passcode.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Verifying..." : "Confirm"}
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
