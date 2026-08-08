import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useValidateTotpForm } from "../model/useValidateTotpForm";

export function TotpVerificationForm() {
  const { register, handleSubmit, errors, handleValidate, isPending } =
    useValidateTotpForm();

  return (
    <form
      onSubmit={handleSubmit(handleValidate)}
      className="mx-auto max-w-md space-y-3"
    >
      <div className="space-y-2">
        <Input
          {...register("passcode")}
          placeholder="Auth passcode"
          inputMode="numeric"
          type="text"
          maxLength={6}
        />

        {errors.passcode && (
          <p className="text-sm text-destructive">{errors.passcode.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Verifying..." : "Confirm"}
      </Button>
    </form>
  );
}
