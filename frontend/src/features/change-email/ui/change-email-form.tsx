import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useChangeEmailForm } from "../model/use-change-email-form";

export function ChangeEmailForm() {
  const { register, errors, handleSubmit, isDisabled, isPending } =
    useChangeEmailForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Input
          type="email"
          placeholder="Enter new email address"
          autoComplete="new-email"
          disabled={isDisabled}
          {...register("newEmail")}
        />

        {errors.newEmail && (
          <p className="text-sm text-destructive text-red-500">
            {errors.newEmail.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isDisabled || isPending}>
          {isPending ? "Changing..." : "Change email"}
        </Button>
      </div>
    </form>
  );
}
