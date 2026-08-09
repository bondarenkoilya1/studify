import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useChangeEmailForm } from "../model/use-change-email-form";

export function ChangeEmailForm() {
  const { register, errors, handleSubmit, isDisabled, isPending } =
    useChangeEmailForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          placeholder="Enter new email address"
          autoComplete="new-email"
          disabled={isDisabled}
          className="sm:flex-1"
          {...register("newEmail")}
        />

        <Button
          type="submit"
          disabled={isDisabled || isPending}
          className="shrink-0"
        >
          {isPending ? "Changing..." : "Change email"}
        </Button>
      </div>

      {errors.newEmail && (
        <p className="text-sm text-destructive">{errors.newEmail.message}</p>
      )}
    </form>
  );
}
